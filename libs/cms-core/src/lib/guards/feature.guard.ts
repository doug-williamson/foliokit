import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { SITE_CONFIG_SERVICE } from '../tokens/site-config-service.token';

/**
 * Route guard factory that gates a page behind its feature-flag in the
 * site configuration.  Redirects to `/not-found` when the feature is
 * disabled or has no content.
 *
 * ```ts
 * { path: 'about', canActivate: [featureGuard('about')], ... }
 * ```
 */
export function featureGuard(page: 'about' | 'links'): CanActivateFn {
  return () => {
    const service = inject(SITE_CONFIG_SERVICE);
    const router = inject(Router);

    return service.getConfig().pipe(
      take(1),
      map((config) => {
        let enabled: boolean;
        if (page === 'about') {
          enabled =
            config.pages?.about?.enabled === true &&
            (config.pages.about.bio?.trim().length ?? 0) > 0;
        } else {
          enabled =
            config.pages?.links?.enabled === true &&
            (config.pages.links?.links?.length ?? 0) > 0;
        }
        return enabled ? true : router.createUrlTree(['/not-found']);
      }),
    );
  };
}
