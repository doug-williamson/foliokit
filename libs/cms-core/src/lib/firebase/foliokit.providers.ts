import {
  APP_INITIALIZER,
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { FirebaseOptions } from 'firebase/app';
import { provideFirebase } from './firebase.providers';
import { FIREBASE_AUTH } from './firebase.config';
import { PostService } from '../services/post.service';
import { SiteConfigService } from '../services/site-config.service';
import { BLOG_POST_SERVICE } from '../tokens/post-service.token';
import { SITE_CONFIG_SERVICE } from '../tokens/site-config-service.token';

/**
 * Injection token for the current site identifier.
 *
 * **Provided by {@link provideFolioKit}** when `siteId` is set in the config.
 * Consumers should inject this token to read the active tenant ID — do not
 * provide it yourself unless you are bypassing `provideFolioKit()`.
 *
 * Useful for multi-tenant deployments where a single Firebase project
 * serves several distinct tenants. Services like `SiteConfigService` can
 * use this to scope Firestore reads to a specific tenant document.
 *
 * @example
 * ```ts
 * // In any component or service — reads the value set by provideFolioKit():
 * readonly tenantId = inject(SITE_ID, { optional: true });
 *
 * loadConfig() {
 *   const id = this.tenantId ?? 'default';
 *   return this.siteConfigService.getSiteConfig(id);
 * }
 * ```
 */
export const SITE_ID = new InjectionToken<string>('SITE_ID');

/**
 * Mutable holder for the active site/tenant identifier.
 *
 * Used for late-binding scenarios (e.g. the admin app resolves the tenant
 * from Firebase Auth at bootstrap rather than from a static config value).
 * Services that need the tenant ID at call time — such as
 * {@link CollectionPaths} — inject this ref and read `.value` on each
 * method invocation.
 *
 * Provided automatically by {@link provideFolioKit}. When a static `siteId`
 * is passed in the config, `.value` is pre-populated immediately.
 */
@Injectable()
export class SiteIdRef {
  value: string | null = null;
}

/**
 * Configuration object accepted by {@link provideFolioKit}.
 */
export interface FolioKitConfig {
  /**
   * Firebase project credentials. Obtain from the Firebase Console under
   * Project Settings → Your apps → SDK setup and configuration.
   *
   * @example
   * ```ts
   * firebaseConfig: {
   *   apiKey: 'AIza...',
   *   authDomain: 'my-project.firebaseapp.com',
   *   projectId: 'my-project',
   *   storageBucket: 'my-project.appspot.com',
   *   messagingSenderId: '1234567890',
   *   appId: '1:1234567890:web:abc123',
   * }
   * ```
   */
  firebaseConfig: FirebaseOptions;

  /**
   * Optional site identifier for multi-site deployments.
   *
   * When provided, the value is registered as the {@link SITE_ID} injection
   * token so that services and components can vary behaviour per site without
   * requiring separate Firebase projects.
   */
  siteId?: string;

  /**
   * Optional Firebase Authentication tenant ID.
   *
   * When provided, `auth.tenantId` is set on the Auth instance during app
   * initialisation via `APP_INITIALIZER`. Required for Google Cloud Identity
   * Platform multi-tenant projects. Has no effect in SSR contexts where Auth
   * is null.
   *
   * @see https://firebase.google.com/docs/auth/web/multi-tenancy
   */
  tenantId?: string;

  /**
   * When `true`, all Firebase services connect to the local emulator suite
   * instead of production endpoints:
   * - Firestore → `127.0.0.1:8080`
   * - Storage   → `127.0.0.1:9199`
   * - Auth      → `http://127.0.0.1:9099`
   *
   * @default false
   */
  useEmulator?: boolean;
}

/**
 * Bootstrap FolioKit in a single call.
 *
 * Registers all Firebase services (app, Firestore, Storage, Auth), binds the
 * default {@link PostService} and {@link SiteConfigService} implementations to
 * their public tokens, and optionally stores `siteId` (tenant routing) / `tenantId` (Firebase Auth) config.
 *
 * Use this instead of `provideFirebase()` unless you need custom service
 * implementations — in which case call `provideFirebase()` directly and
 * provide your own service aliases.
 *
 * **Overriding the default service bindings**
 *
 * The last provider wins in Angular's DI system. Add your own binding *after*
 * `provideFolioKit()` in the providers array to override the defaults:
 *
 * ```ts
 * providers: [
 *   provideFolioKit({ firebaseConfig: environment.firebase }),
 *   { provide: BLOG_POST_SERVICE, useExisting: MyCustomPostService },
 * ]
 * ```
 *
 * @param config - FolioKit configuration including Firebase credentials and
 *   optional site/tenant identifiers.
 * @returns An `EnvironmentProviders` token suitable for use in
 *   `ApplicationConfig.providers` or `bootstrapApplication`.
 *
 * @example
 * ```ts
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideRouter(routes),
 *     provideAnimationsAsync(),
 *     provideHttpClient(withFetch()),
 *     provideMarkdown(),
 *     provideFolioKit({
 *       firebaseConfig: environment.firebase,
 *       useEmulator: environment.useEmulator,
 *     }),
 *   ],
 * };
 * ```
 */
export function provideFolioKit(config: FolioKitConfig): EnvironmentProviders {
  // Pre-populate the mutable holder when a static siteId is provided.
  const siteIdRef = new SiteIdRef();
  if (config.siteId !== undefined) {
    siteIdRef.value = config.siteId;
  }

  const providers: Parameters<typeof makeEnvironmentProviders>[0] = [
    // Firebase services: app, Firestore, Storage, Auth (SSR-safe).
    provideFirebase(config.firebaseConfig, config.useEmulator ?? false),

    // Default concrete service implementations bound to their public tokens.
    // Override by re-providing the token after this call in the same array.
    { provide: BLOG_POST_SERVICE, useExisting: PostService },
    { provide: SITE_CONFIG_SERVICE, useExisting: SiteConfigService },

    // Mutable holder — always provided so late-binding consumers can inject it.
    { provide: SiteIdRef, useValue: siteIdRef },
  ];

  // Optionally expose the tenant routing ID as an injectable constant.
  if (config.siteId !== undefined) {
    providers.push({ provide: SITE_ID, useValue: config.siteId });
  }

  // Optionally apply a Firebase Auth tenant ID for multi-tenant projects.
  // Uses APP_INITIALIZER to run after the Auth instance is created.
  if (config.tenantId !== undefined) {
    const tenantId = config.tenantId;
    providers.push({
      provide: APP_INITIALIZER,
      useFactory: () => {
        const platformId = inject(PLATFORM_ID);
        const auth = inject(FIREBASE_AUTH);
        return () => {
          if (isPlatformBrowser(platformId) && auth) {
            auth.tenantId = tenantId;
          }
        };
      },
      multi: true,
    });
  }

  return makeEnvironmentProviders(providers);
}
