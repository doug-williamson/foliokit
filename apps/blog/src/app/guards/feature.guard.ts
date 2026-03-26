import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SITE_CONFIG_SERVICE } from '@foliokit/cms-core';
import { map, take } from 'rxjs/operators';

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
