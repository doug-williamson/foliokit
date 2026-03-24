import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SITE_CONFIG_SERVICE } from '@foliokit/cms-core';
import { map, take } from 'rxjs/operators';

export function featureGuard(page: 'about' | 'links'): CanActivateFn {
  return () => {
    const service = inject(SITE_CONFIG_SERVICE);

    return service.getConfig().pipe(
      take(1),
      map((config) => {
        if (page === 'about') {
          return (
            config.pages?.about?.enabled === true &&
            (config.pages.about.bio?.trim().length ?? 0) > 0
          );
        }
        return (
          config.pages?.links?.enabled === true &&
          (config.pages.links?.links?.length ?? 0) > 0
        );
      }),
    );
  };
}
