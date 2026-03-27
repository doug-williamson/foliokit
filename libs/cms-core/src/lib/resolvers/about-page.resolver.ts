import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn, Router } from '@angular/router';
import { map, tap, take } from 'rxjs/operators';
import { SITE_CONFIG_SERVICE } from '../tokens/site-config-service.token';
import type { AboutPageConfig } from '../models/site-config.model';

const ABOUT_PAGE_KEY = makeStateKey<AboutPageConfig | null>('about-page');

/** Options for {@link createAboutPageResolver}. */
export interface AboutPageResolverOptions {
  /**
   * Route to redirect to when about page config is absent or has no `bio`.
   * @default '/not-found'
   */
  notFoundRoute?: string;
}

/**
 * Factory that creates a resolver for the About page.
 *
 * Reads `AboutPageConfig` from `SITE_CONFIG_SERVICE.getAboutConfig()`, using
 * Angular's `TransferState` to avoid a duplicate Firestore read on browser
 * hydration after SSR. Redirects to `notFoundRoute` (default: `/not-found`)
 * when the config is absent or has no `bio` field.
 *
 * `SITE_CONFIG_SERVICE` must be provided in your app — either the default
 * `SiteConfigService` (client SDK) or a server-side override (Admin SDK) via
 * `app.config.server.ts`.
 *
 * @example
 * ```ts
 * // app.routes.ts
 * {
 *   path: 'about',
 *   resolve: { about: createAboutPageResolver() },
 *   loadComponent: () => import('./about/about.component').then(m => m.AboutComponent),
 * }
 * ```
 */
export function createAboutPageResolver(
  options?: AboutPageResolverOptions,
): ResolveFn<AboutPageConfig> {
  const notFoundRoute = options?.notFoundRoute ?? '/not-found';

  return () => {
    const transferState = inject(TransferState);
    const service = inject(SITE_CONFIG_SERVICE);
    const platformId = inject(PLATFORM_ID);
    const router = inject(Router);

    if (transferState.hasKey(ABOUT_PAGE_KEY)) {
      const about = transferState.get(ABOUT_PAGE_KEY, null);
      transferState.remove(ABOUT_PAGE_KEY);
      if (!about || !about.bio) {
        return router.createUrlTree([notFoundRoute]) as never;
      }
      return about;
    }

    return service.getAboutConfig().pipe(
      take(1),
      tap((about) => {
        if (isPlatformServer(platformId)) {
          transferState.set(ABOUT_PAGE_KEY, about);
        }
      }),
      map((about) => {
        if (!about || !about.bio) {
          return router.createUrlTree([notFoundRoute]) as never;
        }
        return about;
      }),
    );
  };
}
