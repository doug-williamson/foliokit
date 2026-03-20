import { inject, TransferState } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { tap, take } from 'rxjs/operators';
import {
  BLOG_POST_SERVICE,
  POSTS_TRANSFER_KEY,
} from '@foliokit/cms-core';
import type { BlogPost } from '@foliokit/cms-core';

export const postsResolver: ResolveFn<BlogPost[]> = () => {
  const transferState = inject(TransferState);
  const service = inject(BLOG_POST_SERVICE);

  if (transferState.hasKey(POSTS_TRANSFER_KEY)) {
    const posts = transferState.get(POSTS_TRANSFER_KEY, []);
    transferState.remove(POSTS_TRANSFER_KEY);
    return posts;
  }

  return service.getPublishedPosts().pipe(
    take(1),
    tap((posts) => transferState.set(POSTS_TRANSFER_KEY, posts)),
  );
};
