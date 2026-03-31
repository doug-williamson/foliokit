/**
 * Server-side tenant resolver — maps hostnames to tenant IDs.
 *
 * Uses the Firebase Admin SDK to query TenantConfig documents by
 * `subdomain` or `customDomain`. Results are cached in an LRU map
 * to avoid a Firestore read on every request.
 *
 * This module is server-only. Never import it in browser bundles.
 */
import { getFirestore } from 'firebase-admin/firestore';

const DEFAULT_TENANT = 'default';
const CACHE_MAX_SIZE = 200;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  tenantId: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function evictStale(): void {
  if (cache.size <= CACHE_MAX_SIZE) return;
  // Remove oldest entries when over capacity.
  const entries = [...cache.entries()].sort(
    (a, b) => a[1].timestamp - b[1].timestamp,
  );
  const toRemove = entries.slice(0, entries.length - CACHE_MAX_SIZE);
  for (const [key] of toRemove) cache.delete(key);
}

/**
 * Resolves a hostname to a tenant ID.
 *
 * Resolution order:
 * 1. Check the LRU cache.
 * 2. Query Firestore for a TenantConfig where `customDomain == hostname`.
 * 3. Extract the subdomain and query for `subdomain == extracted`.
 * 4. Fall back to `'default'`.
 *
 * @param hostname - The `Host` header value (without port).
 * @param baseDomain - The base domain for subdomain extraction
 *   (e.g. `'foliokit.app'`). Defaults to `FOLIOKIT_BASE_DOMAIN` env var.
 */
export async function resolveTenantFromHostname(
  hostname: string,
  baseDomain?: string,
): Promise<string> {
  const host = hostname.toLowerCase().replace(/:\d+$/, '');

  // Cache hit?
  const cached = cache.get(host);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.tenantId;
  }

  const db = getFirestore();
  let tenantId: string | null = null;

  try {
    // 1. Try custom domain match.
    const customDomainSnap = await db
      .collection('tenants')
      .where('customDomain', '==', host)
      .limit(1)
      .get();
    if (!customDomainSnap.empty) {
      tenantId = customDomainSnap.docs[0].id;
    }

    // 2. Try subdomain match.
    if (!tenantId) {
      const base = (baseDomain ?? process.env['FOLIOKIT_BASE_DOMAIN'] ?? '').toLowerCase();
      if (base && host.endsWith(`.${base}`)) {
        const subdomain = host.slice(0, -(base.length + 1));
        if (subdomain && !subdomain.includes('.')) {
          const subSnap = await db
            .collection('tenants')
            .where('subdomain', '==', subdomain)
            .limit(1)
            .get();
          if (!subSnap.empty) {
            tenantId = subSnap.docs[0].id;
          }
        }
      }
    }
  } catch (err) {
    console.error('[TenantResolver] Firestore query failed:', err);
  }

  const resolved = tenantId ?? DEFAULT_TENANT;

  // Populate cache.
  cache.set(host, { tenantId: resolved, timestamp: Date.now() });
  evictStale();

  return resolved;
}

/**
 * Parses the subdomain from a hostname relative to a base domain.
 * Returns `null` when the hostname is the bare base domain or doesn't
 * match the base at all.
 *
 * @example
 * ```ts
 * extractSubdomain('acme.foliokit.app', 'foliokit.app') // 'acme'
 * extractSubdomain('foliokit.app', 'foliokit.app')       // null
 * extractSubdomain('localhost', 'foliokit.app')           // null
 * ```
 */
export function extractSubdomain(
  hostname: string,
  baseDomain: string,
): string | null {
  const host = hostname.toLowerCase().replace(/:\d+$/, '');
  const base = baseDomain.toLowerCase();
  if (!host.endsWith(`.${base}`)) return null;
  const sub = host.slice(0, -(base.length + 1));
  return sub && !sub.includes('.') ? sub : null;
}

/**
 * Invalidates the cached entry for a hostname. Useful after a tenant's
 * custom domain or subdomain is changed.
 */
export function invalidateTenantCache(hostname: string): void {
  cache.delete(hostname.toLowerCase().replace(/:\d+$/, ''));
}
