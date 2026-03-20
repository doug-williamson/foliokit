import { inject, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn } from '@angular/router';
import { tap, take } from 'rxjs/operators';
import {
  BLOG_POST_SERVICE,
  POST_TRANSFER_KEY,
} from '@foliokit/cms-core';
import type { BlogPost } from '@foliokit/cms-core';

export const postResolver: ResolveFn<BlogPost | null> = (route) => {
  const transferState = inject(TransferState);
  const service = inject(BLOG_POST_SERVICE);
  const platformId = inject(PLATFORM_ID);
  const slug = route.paramMap.get('slug') ?? '';

  if (transferState.hasKey(POST_TRANSFER_KEY)) {
    const post = transferState.get(POST_TRANSFER_KEY, null);
    transferState.remove(POST_TRANSFER_KEY);
    return post;
  }

  return service.getPostBySlug(slug).pipe(
    take(1),
    tap((post) => {
      if (isPlatformServer(platformId)) {
        transferState.set(POST_TRANSFER_KEY, post);
      }
    }),
  );
};
