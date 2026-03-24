import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SITE_CONFIG_SERVICE } from '@foliokit/cms-core';
import type { SiteConfig } from '@foliokit/cms-core';
import { map, take } from 'rxjs/operators';

export function featureGuard(
  flag: keyof NonNullable<SiteConfig['features']>,
): CanActivateFn {
  return () => {
    const service = inject(SITE_CONFIG_SERVICE);
    const router = inject(Router);

    return service.getFeatures().pipe(
      take(1),
      map((features) => {
        if (features?.[flag]) return true;
        return router.parseUrl('/not-found');
      }),
    );
  };
}
