import {
  APP_INITIALIZER,
  EnvironmentProviders,
  Injectable,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { FirebaseOptions } from 'firebase/app';
import { doc, getDoc } from 'firebase/firestore';
import { provideMarkdown } from 'ngx-markdown';

import { provideFolioKit, SITE_ID, type FolioKitConfig } from './firebase/foliokit.providers';
import { FIRESTORE } from './firebase/firebase.config';
import { resolveSiteConfigDocPath } from './firebase/collection-paths';
import { SITE_CONFIG } from './tokens/site-config.token';
import { SHELL_CONFIG, type ShellConfig } from './tokens/shell-config.token';
import { normalizeSiteConfig } from './utils/normalize-site-config';
import type { SiteConfig } from './models/site-config.model';

/**
 * Internal holder populated by the APP_INITIALIZER and read by the
 * SITE_CONFIG factory. Keeps the async-loaded value reachable from a
 * synchronous useFactory.
 */
@Injectable()
class _SiteConfigRef {
  config: SiteConfig | null = null;
}

// Phase 11 note: FolioKitOptions.tenantId added in Phase 11a commit 2.

export interface FolioKitOptions {
  /** Firebase project credentials (required). */
  firebase: FirebaseOptions;

  /**
   * Tenant identifier used to resolve the site-config Firestore document.
   * @default 'default'
   */
  tenantId?: string;

  /**
   * When `true`, the client Firebase SDK connects to the local emulators
   * (Firestore, Storage, Auth). Must match SSR when using
   * `FIRESTORE_EMULATOR_HOST` for the Admin SDK, or lists and detail views
   * will read different backends after navigation vs full reload.
   */
  useEmulator?: boolean;

  /** Optional shell configuration forwarded to {@link SHELL_CONFIG}. */
  shell?: Partial<ShellConfig>;

  features?: {
    /**
     * When `true` (the default), registers `provideMarkdown()` from
     * ngx-markdown so that Markdown rendering works out of the box.
     * @default true
     */
    markdown?: boolean;

    /**
     * When `true`, Firebase Auth is available for injection. Auth is
     * always initialised by the underlying `provideFirebase()` call,
     * but this flag signals intent for documentation / future gating.
     * @default false
     */
    auth?: boolean;
  };
}

/**
 * High-level provider factory that bootstraps an entire FolioKit application
 * in a single call.
 *
 * Internally delegates to {@link provideFolioKit} for Firebase + default
 * service bindings, then layers on:
 * - An `APP_INITIALIZER` that eagerly loads the `SiteConfig` document from
 *   Firestore and makes it available via the {@link SITE_CONFIG} token.
 * - Optional {@link SHELL_CONFIG} provision.
 * - Optional `provideMarkdown()` from ngx-markdown.
 *
 * @example
 * ```ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     providesFolioKit({
 *       firebase: environment.firebase,
 *       shell: { appName: 'My Blog' },
 *       features: { markdown: true },
 *     }),
 *     provideRouter(routes),
 *   ],
 * };
 * ```
 */
export function providesFolioKit(options: FolioKitOptions): EnvironmentProviders {
  const tenantId = options.tenantId ?? 'default';

  // Build the config for the lower-level provideFolioKit().
  const coreConfig: FolioKitConfig = {
    firebaseConfig: options.firebase,
    siteId: tenantId,
    useEmulator: options.useEmulator ?? false,
  };

  const providers: Parameters<typeof makeEnvironmentProviders>[0] = [
    // Firebase services + default service-token bindings.
    provideFolioKit(coreConfig),

    // Internal holder for the eagerly-loaded SiteConfig value.
    { provide: _SiteConfigRef, useValue: new _SiteConfigRef() },

    // SITE_CONFIG reads from the holder — guaranteed to run after
    // APP_INITIALIZER because Angular resolves initializers before
    // rendering any component or running any guard.
    {
      provide: SITE_CONFIG,
      useFactory: () => inject(_SiteConfigRef).config,
    },

    // APP_INITIALIZER: fetch the SiteConfig document from Firestore.
    // Reads SITE_ID at injection time so that server-side overrides
    // (e.g. per-request tenant resolution) are respected.
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const ref = inject(_SiteConfigRef);
        const firestore = inject(FIRESTORE);
        const platformId = inject(PLATFORM_ID);
        const activeTenantId = inject(SITE_ID, { optional: true }) ?? tenantId;

        return async () => {
          // Client Firestore SDK is null on the server — skip gracefully.
          if (!isPlatformBrowser(platformId) || !firestore) return;

          const docPath = resolveSiteConfigDocPath(activeTenantId, activeTenantId);
          const segments = docPath.split('/');
          // doc() expects (firestore, collectionPath, docId, ...pathSegments)
          const docRef = doc(firestore, segments[0], ...segments.slice(1));

          try {
            const snap = await getDoc(docRef);
            if (snap.exists()) {
              ref.config = normalizeSiteConfig({ id: snap.id, ...snap.data() });
            }
          } catch {
            // Swallow network errors during init — consumers should handle
            // a null SITE_CONFIG gracefully.
          }
        };
      },
      multi: true,
    },
  ];

  // Optional shell configuration.
  if (options.shell !== undefined) {
    providers.push({ provide: SHELL_CONFIG, useValue: signal(options.shell as ShellConfig) });
  }

  // Markdown support (on by default).
  if (options.features?.markdown !== false) {
    providers.push(provideMarkdown());
  }

  return makeEnvironmentProviders(providers);
}
