/**
 * Client-side tenant ID resolution from the browser hostname.
 *
 * Extracts the subdomain from `window.location.hostname` relative to
 * the configured base domain. Falls back to `'default'` when running
 * on the bare base domain or an unrecognized host (e.g. localhost).
 *
 * For custom domains, the server resolves the tenant via Firestore
 * and passes it to the client through Angular `TransferState`.
 */

/**
 * Resolves a tenant ID from the current browser hostname.
 *
 * @param baseDomain - The platform base domain (e.g. `'foliokit.app'`).
 * @param fallback - Returned when the hostname doesn't match the base
 *   domain pattern. Defaults to `'default'`.
 *
 * @example
 * ```ts
 * // hostname = 'acme.foliokit.app'
 * resolveTenantFromBrowserHostname('foliokit.app') // 'acme'
 *
 * // hostname = 'localhost'
 * resolveTenantFromBrowserHostname('foliokit.app') // 'default'
 * ```
 */
export function resolveTenantFromBrowserHostname(
  baseDomain: string,
  fallback = 'default',
): string {
  if (typeof window === 'undefined') return fallback;
  const host = window.location.hostname.toLowerCase();
  const base = baseDomain.toLowerCase();
  if (!host.endsWith(`.${base}`)) return fallback;
  const sub = host.slice(0, -(base.length + 1));
  return sub && !sub.includes('.') ? sub : fallback;
}
