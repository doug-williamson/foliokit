import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn, Router } from '@angular/router';
import { map, tap, take } from 'rxjs/operators';
import { SITE_CONFIG_SERVICE } from '../tokens/site-config-service.token';
import type { LinksPageConfig } from '../models/site-config.model';

const LINKS_PAGE_KEY = makeStateKey<LinksPageConfig | null>('links-page');

/** Options for {@link createLinksPageResolver}. */
export interface LinksPageResolverOptions {
  /**
   * Route to redirect to when links page config is absent or has no links.
   * @default '/not-found'
   */
  notFoundRoute?: string;
}

/**
 * Factory that creates a resolver for the Links page.
 *
 * Reads `LinksPageConfig` from `SITE_CONFIG_SERVICE.getConfig().pages.links`,
 * using Angular's `TransferState` to avoid a duplicate Firestore read on
 * browser hydration after SSR. Redirects to `notFoundRoute` (default:
 * `/not-found`) when the config is absent or the `links` array is empty.
 *
 * `SITE_CONFIG_SERVICE` must be provided in your app — either the default
 * `SiteConfigService` (client SDK) or a server-side override (Admin SDK) via
 * `app.config.server.ts`.
 *
 * @example
 * ```ts
 * // app.routes.ts
 * {
 *   path: 'links',
 *   resolve: { page: createLinksPageResolver() },
 *   loadComponent: () => import('@foliokit/cms-ui').then(m => m.LinksPageComponent),
 * }
 * ```
 */
export function createLinksPageResolver(
  options?: LinksPageResolverOptions,
): ResolveFn<LinksPageConfig> {
  const notFoundRoute = options?.notFoundRoute ?? '/not-found';

  return () => {
    const transferState = inject(TransferState);
    const service = inject(SITE_CONFIG_SERVICE);
    const platformId = inject(PLATFORM_ID);
    const router = inject(Router);

    if (transferState.hasKey(LINKS_PAGE_KEY)) {
      const links = transferState.get(LINKS_PAGE_KEY, null);
      transferState.remove(LINKS_PAGE_KEY);
      if (!links || !links.links?.length) {
        return router.createUrlTree([notFoundRoute]) as never;
      }
      return links;
    }

    return service.getConfig().pipe(
      take(1),
      tap((config) => {
        if (isPlatformServer(platformId)) {
          transferState.set(LINKS_PAGE_KEY, config.pages?.links ?? null);
        }
      }),
      map((config) => {
        const links = config.pages?.links;
        if (!links || !links.links?.length) {
          return router.createUrlTree([notFoundRoute]) as never;
        }
        return links;
      }),
    );
  };
}
