import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn, Router } from '@angular/router';
import { tap, take, map } from 'rxjs/operators';
import { SITE_CONFIG_SERVICE } from '@foliokit/cms-core';
import type { LinksPageConfig } from '@foliokit/cms-core';

const LINKS_PAGE_KEY = makeStateKey<LinksPageConfig | null>('links-page');

export const linksPageResolver: ResolveFn<LinksPageConfig> = () => {
  const transferState = inject(TransferState);
  const service = inject(SITE_CONFIG_SERVICE);
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (transferState.hasKey(LINKS_PAGE_KEY)) {
    const links = transferState.get(LINKS_PAGE_KEY, null);
    transferState.remove(LINKS_PAGE_KEY);
    if (!links || !links.links?.length) {
      return router.createUrlTree(['/not-found']) as never;
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
        return router.createUrlTree(['/not-found']) as never;
      }
      return links;
    }),
  );
};
