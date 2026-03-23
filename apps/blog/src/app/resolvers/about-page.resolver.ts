import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn, Router } from '@angular/router';
import { tap, take, map } from 'rxjs/operators';
import { SiteConfigService } from '@foliokit/cms-core';
import type { AboutPageConfig } from '@foliokit/cms-core';

// NOTE: the Firestore document site-config/main must have a pages.about field
// populated for this resolver to succeed. If it is missing, the resolver
// redirects to /not-found.
const ABOUT_PAGE_KEY = makeStateKey<AboutPageConfig | null>('about-page');

export const aboutPageResolver: ResolveFn<AboutPageConfig> = () => {
  const transferState = inject(TransferState);
  const service = inject(SiteConfigService);
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
