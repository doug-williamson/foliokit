import {
  APP_INITIALIZER,
  EnvironmentProviders,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideMarkdown } from 'ngx-markdown';
import {
  ADMIN_EMAIL,
  FIRESTORE,
  SITE_ID,
  TenantConfigRef,
  TENANT_CONFIG,
} from '@foliokit/cms-core';
import { doc, getDoc } from 'firebase/firestore';
import { SiteConfigEditorStore } from './site-config-editor/site-config-editor.store';
import { provideAdminMatIcons } from './icons/provide-admin-mat-icons';

/**
 * Configuration accepted by {@link provideAdminKit}.
 */
export interface AdminKitConfig {
  /**
   * The email address that identifies the platform super-admin.
   *
   * Optional when multi-tenancy is enabled — in that case the tenant
   * owner is determined dynamically from the tenant document's
   * `ownerEmail` field. When provided, this value acts as a fallback
   * super-admin that can access any tenant.
   *
   * @see {@link https://github.com/dougwilliamson/foliokit/blob/main/docs/security/admin-authorization.md}
   */
  adminEmail?: string;

  /**
   * Set to `false` to skip registering `provideMarkdown()`.
   * Only disable this if you call `provideMarkdown()` yourself with custom
   * options elsewhere in your `app.config.ts`.
   *
   * @default true
   */
  markdown?: boolean;
}

/**
 * Registers all providers required by the FolioKit admin UI in a single call.
 *
 * Call this **after** `provideFolioKit()` in your `ApplicationConfig.providers`
 * array. Together they cover everything the admin needs:
 *
 * ```ts
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideRouter(adminRoutes, withComponentInputBinding()),
 *     provideHttpClient(withFetch()),
 *     provideFolioKit({ firebaseConfig: environment.firebase, siteId: 'my-tenant' }),
 *     provideAdminKit({ adminEmail: environment.adminEmail }),
 *   ],
 * };
 * ```
 *
 * **What this registers:**
 * - `ADMIN_EMAIL` token (optional) — platform super-admin fallback
 * - `TenantConfigRef` + `TENANT_CONFIG` — eagerly-loaded tenant document;
 *   `AuthService.isAdmin()` checks the tenant's `ownerEmail` first
 * - `provideAnimationsAsync()` — required by Angular Material
 * - `provideNativeDateAdapter()` — required by Material date pickers
 * - `SiteConfigEditorStore` — global NgRx Signals store for site config
 * - `provideAdminMatIcons()` — registers all Material Icons used by admin
 *   components as inlined SVGs so the host app does not need the font
 * - `provideMarkdown()` — required by the post editor's markdown preview
 *   (skip with `markdown: false` if you configure it yourself)
 *
 * @param config - Admin kit configuration.
 * @returns An `EnvironmentProviders` token suitable for `ApplicationConfig.providers`.
 */
export function provideAdminKit(config: AdminKitConfig): EnvironmentProviders {
  const tenantConfigRef = new TenantConfigRef();

  const providers: Parameters<typeof makeEnvironmentProviders>[0] = [
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideAdminMatIcons(),
    SiteConfigEditorStore,

    // Tenant config holder — populated by the APP_INITIALIZER below.
    { provide: TenantConfigRef, useValue: tenantConfigRef },

    // TENANT_CONFIG reads from the holder (resolved after APP_INITIALIZER).
    {
      provide: TENANT_CONFIG,
      useFactory: () => inject(TenantConfigRef).config,
    },

    // APP_INITIALIZER: fetch the tenant document from Firestore so that
    // AuthService.isAdmin() can check the ownerEmail at runtime.
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const ref = inject(TenantConfigRef);
        const firestore = inject(FIRESTORE);
        const platformId = inject(PLATFORM_ID);
        const siteId = inject(SITE_ID, { optional: true });

        return async () => {
          if (!isPlatformBrowser(platformId) || !firestore || !siteId) return;
          // 'default' means single-tenant mode — no tenant doc to fetch.
          if (siteId === 'default') return;

          try {
            const snap = await getDoc(doc(firestore, 'tenants', siteId));
            if (snap.exists()) {
              ref.config = { tenantId: snap.id, ...snap.data() } as any;
            }
          } catch {
            // Swallow network errors — AuthService falls back to ADMIN_EMAIL.
          }
        };
      },
      multi: true,
    },
  ];

  // Platform super-admin email (optional).
  if (config.adminEmail !== undefined) {
    providers.push({ provide: ADMIN_EMAIL, useValue: config.adminEmail });
  }

  if (config.markdown !== false) {
    providers.push(provideMarkdown());
  }

  return makeEnvironmentProviders(providers);
}
