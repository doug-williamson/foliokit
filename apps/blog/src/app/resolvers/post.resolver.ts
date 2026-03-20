import { inject, TransferState } from '@angular/core';
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
  const slug = route.paramMap.get('slug') ?? '';

  if (transferState.hasKey(POST_TRANSFER_KEY)) {
    const post = transferState.get(POST_TRANSFER_KEY, null);
    transferState.remove(POST_TRANSFER_KEY);
    return post;
  }

  return service.getPostBySlug(slug).pipe(
    take(1),
    tap((post) => transferState.set(POST_TRANSFER_KEY, post)),
  );
};
