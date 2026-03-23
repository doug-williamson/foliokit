import { inject, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn, Router } from '@angular/router';
import { tap, take, map } from 'rxjs/operators';
import {
  BLOG_PAGE_SERVICE,
  PAGE_TRANSFER_KEY,
} from '@foliokit/cms-core';
import type { CmsPageUnion } from '@foliokit/cms-core';

/**
 * @deprecated pageResolver is superseded by aboutPageResolver for the /about route.
 * Retained for LinksPage (/links route) only. Will be removed in a future release.
 */
export const pageResolver: ResolveFn<CmsPageUnion> = (route) => {
  const transferState = inject(TransferState);
  const service = inject(BLOG_PAGE_SERVICE);
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const slug = (route.data['pageId'] as string | undefined) ?? route.paramMap.get('slug') ?? '';

  if (transferState.hasKey(PAGE_TRANSFER_KEY)) {
    const page = transferState.get(PAGE_TRANSFER_KEY, null);
    transferState.remove(PAGE_TRANSFER_KEY);
    if (page) return page;
    return router.createUrlTree(['/not-found']) as never;
  }

  return service.getPageById(slug).pipe(
    take(1),
    tap((page) => {
      if (isPlatformServer(platformId)) {
        transferState.set(PAGE_TRANSFER_KEY, page);
      }
    }),
    map((page) => {
      if (!page) return router.createUrlTree(['/not-found']) as never;
      return page;
    }),
  );
};
