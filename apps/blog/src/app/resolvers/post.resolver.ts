import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ResolveFn } from '@angular/router';
import { tap, take } from 'rxjs/operators';
import { BLOG_POST_SERVICE } from '@foliokit/cms-core';
import type { BlogPost } from '@foliokit/cms-core';

const POST_KEY = makeStateKey<BlogPost>('post-detail');

export const postResolver: ResolveFn<BlogPost | null> = (route) => {
  const transferState = inject(TransferState);
  const service = inject(BLOG_POST_SERVICE);
  const platformId = inject(PLATFORM_ID);
  const slug = route.paramMap.get('slug') ?? '';

  if (isPlatformBrowser(platformId)) {
    if (transferState.hasKey(POST_KEY)) {
      const post = transferState.get(POST_KEY, null);
      transferState.remove(POST_KEY);
      return post;
    }
    return service.getPostBySlug(slug).pipe(take(1));
  } else {
    return service.getPostBySlug(slug).pipe(
      take(1),
      tap((post) => transferState.set(POST_KEY, post)),
    );
  }
};
