import { Injectable, InjectionToken } from '@angular/core';
import type { TenantConfig } from '../models/tenant-config.model';

/**
 * Internal holder populated by an APP_INITIALIZER (registered by
 * `provideAdminKit`) and read by AuthService to determine the tenant
 * owner's email. Follows the same async-init pattern as `_SiteConfigRef`
 * in `provide-folio-kit.ts`.
 */
@Injectable()
export class TenantConfigRef {
  config: TenantConfig | null = null;
}

/**
 * Injection token holding the eagerly-loaded {@link TenantConfig} value.
 *
 * Populated during app init when a `siteId` is configured. Used by
 * `AuthService.isAdmin()` to verify the authenticated user is the
 * tenant owner.
 */
export const TENANT_CONFIG = new InjectionToken<TenantConfig | null>('TENANT_CONFIG');
