import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn, Router } from '@angular/router';
import { tap, take, map } from 'rxjs/operators';
import { SITE_CONFIG_SERVICE } from '@foliokit/cms-core';
import type { AboutPageConfig } from '@foliokit/cms-core';

// NOTE: the Firestore document site-config/default must have a pages.about
// field populated for this resolver to succeed. On the server, SITE_CONFIG_SERVICE
// is bound to ServerSiteConfigService (Admin SDK). In the browser it falls back
// to the browser-side SiteConfigService (client SDK).
const ABOUT_PAGE_KEY = makeStateKey<AboutPageConfig | null>('about-page');

export const aboutPageResolver: ResolveFn<AboutPageConfig> = () => {
  const transferState = inject(TransferState);
  const service = inject(SITE_CONFIG_SERVICE);
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);

  if (transferState.hasKey(ABOUT_PAGE_KEY)) {
    const about = transferState.get(ABOUT_PAGE_KEY, null);
    transferState.remove(ABOUT_PAGE_KEY);
    if (about) return about;
    return router.createUrlTree(['/not-found']) as never;
  }

  return service.getAboutConfig().pipe(
    take(1),
    tap((about) => {
      if (isPlatformServer(platformId)) {
        transferState.set(ABOUT_PAGE_KEY, about);
      }
    }),
    map((about) => {
      if (!about) return router.createUrlTree(['/not-found']) as never;
      return about;
    }),
  );
};
