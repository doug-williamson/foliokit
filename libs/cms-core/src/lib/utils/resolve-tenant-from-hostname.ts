/**
 * Client-side tenant ID resolution from the browser hostname.
 *
 * Extracts the subdomain from `window.location.hostname` relative to
 * the configured base domain. Falls back to `'default'` when running
 * on the bare base domain or an unrecognized host.
 *
 * For custom domains, the server resolves the tenant via Firestore
 * and passes it to the client through Angular `TransferState`.
 */

/** The production apex domain for subdomain-based tenant routing. */
export const FOLIOKITCMS_APEX = 'foliokitcms.com';

const DEV_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const DEV_TENANT = 'foliokitcms';

/**
 * Resolves a tenant ID from the current browser hostname.
 *
 * @param baseDomain - The platform base domain (e.g. `'foliokitcms.com'`).
 * @param fallback - Returned when the hostname doesn't match the base
 *   domain pattern. Defaults to `'default'`.
 *
 * @example
 * ```ts
 * // hostname = 'acme.foliokitcms.com'
 * resolveTenantFromBrowserHostname('foliokitcms.com') // 'acme'
 *
 * // hostname = 'localhost'
 * resolveTenantFromBrowserHostname('foliokitcms.com') // 'foliokitcms'
 * ```
 */
export function resolveTenantFromBrowserHostname(
  baseDomain: string,
  fallback = 'default',
): string {
  if (typeof window === 'undefined') return fallback;
  const host = window.location.hostname.toLowerCase();
  if (DEV_HOSTS.has(host)) return DEV_TENANT;
  const base = baseDomain.toLowerCase();
  if (!host.endsWith(`.${base}`)) return fallback;
  const sub = host.slice(0, -(base.length + 1));
  return sub && !sub.includes('.') ? sub : fallback;
}
