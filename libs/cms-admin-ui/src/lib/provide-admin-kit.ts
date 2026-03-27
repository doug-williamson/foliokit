import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideMarkdown } from 'ngx-markdown';
import { ADMIN_EMAIL } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from './site-config-editor/site-config-editor.store';

/**
 * Configuration accepted by {@link provideAdminKit}.
 */
export interface AdminKitConfig {
  /**
   * The email address that identifies the admin user.
   *
   * This value is registered as the `ADMIN_EMAIL` injection token and is read
   * by `AuthService.isAdmin()`. It **must match** the email used in your
   * Firestore security rules and in any seed scripts that create the initial
   * admin user.
   *
   * @see {@link https://github.com/foliokit/foliokit/blob/main/docs/security/admin-authorization.md}
   *
   * @example
   * ```ts
   * provideAdminKit({ adminEmail: environment.adminEmail })
   * ```
   */
  adminEmail: string;

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
 *     provideFolioKit({ firebaseConfig: environment.firebase }),
 *     provideAdminKit({ adminEmail: environment.adminEmail }),
 *   ],
 * };
 * ```
 *
 * **What this registers:**
 * - `ADMIN_EMAIL` token — used by `AuthService.isAdmin()` and `authGuard`
 * - `provideAnimationsAsync()` — required by Angular Material
 * - `provideNativeDateAdapter()` — required by Material date pickers
 * - `SiteConfigEditorStore` — global NgRx Signals store for site config
 * - `provideMarkdown()` — required by the post editor's markdown preview
 *   (skip with `markdown: false` if you configure it yourself)
 *
 * @param config - Admin kit configuration.
 * @returns An `EnvironmentProviders` token suitable for `ApplicationConfig.providers`.
 */
export function provideAdminKit(config: AdminKitConfig): EnvironmentProviders {
  const providers: Parameters<typeof makeEnvironmentProviders>[0] = [
    { provide: ADMIN_EMAIL, useValue: config.adminEmail },
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    SiteConfigEditorStore,
  ];

  if (config.markdown !== false) {
    providers.push(provideMarkdown());
  }

  return makeEnvironmentProviders(providers);
}
