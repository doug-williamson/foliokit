import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ResolveFn } from '@angular/router';
import { switchMap, tap, take, of } from 'rxjs';
import { BLOG_POST_SERVICE, AuthorService } from '@foliokit/cms-core';
import type { Author, BlogPost } from '@foliokit/cms-core';

export interface PostRouteData {
  post: BlogPost | null;
  author: Author | null;
}

const POST_KEY = makeStateKey<BlogPost | null>('post-detail');
const POST_AUTHOR_KEY = makeStateKey<Author | null>('post-detail-author');

export const postResolver: ResolveFn<PostRouteData> = (route) => {
  const transferState = inject(TransferState);
  const postService = inject(BLOG_POST_SERVICE);
  const authorService = inject(AuthorService);
  const platformId = inject(PLATFORM_ID);
  const slug = route.paramMap.get('slug') ?? '';
  const isBrowser = isPlatformBrowser(platformId);

  if (isBrowser && transferState.hasKey(POST_KEY)) {
    const post = transferState.get(POST_KEY, null);
    const author = transferState.hasKey(POST_AUTHOR_KEY)
      ? transferState.get(POST_AUTHOR_KEY, null)
      : null;
    transferState.remove(POST_KEY);
    transferState.remove(POST_AUTHOR_KEY);
    return of({ post, author });
  }

  return postService.getPostBySlug(slug).pipe(
    take(1),
    tap((post) => {
      if (!isBrowser) transferState.set(POST_KEY, post);
    }),
    switchMap((post) => {
      if (!post?.authorId) return of({ post, author: null as Author | null });
      return authorService.getById(post.authorId).pipe(
        take(1),
        tap((author) => {
          if (!isBrowser) transferState.set(POST_AUTHOR_KEY, author);
        }),
        switchMap((author) => of({ post, author })),
      );
    }),
  );
};
