import { inject, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn } from '@angular/router';
import { take, tap } from 'rxjs/operators';
import { BLOG_POST_SERVICE, POSTS_TRANSFER_KEY } from '../tokens/post-service.token';
import type { BlogPost } from '../models/post.model';

/**
 * Factory that creates a resolver for the published posts list.
 *
 * Reads all published posts from `BLOG_POST_SERVICE.getPublishedPosts()`,
 * using Angular's `TransferState` (`POSTS_TRANSFER_KEY`) to avoid a duplicate
 * Firestore read on browser hydration after SSR. Always resolves to an array
 * (empty on error or when no posts are published).
 *
 * `BLOG_POST_SERVICE` must be provided in your app — either the default
 * `PostService` (client SDK) or a server-side override (Admin SDK) via
 * `app.config.server.ts`.
 *
 * @example
 * ```ts
 * // app.routes.ts
 * {
 *   path: 'posts',
 *   resolve: { posts: createPostsResolver() },
 *   loadComponent: () => import('./post-list/post-list.component').then(m => m.PostListComponent),
 * }
 * ```
 */
export function createPostsResolver(): ResolveFn<BlogPost[]> {
  return () => {
    const transferState = inject(TransferState);
    const service = inject(BLOG_POST_SERVICE);
    const platformId = inject(PLATFORM_ID);

    if (transferState.hasKey(POSTS_TRANSFER_KEY)) {
      const posts = transferState.get(POSTS_TRANSFER_KEY, []);
      transferState.remove(POSTS_TRANSFER_KEY);
      return posts;
    }

    return service.getPublishedPosts().pipe(
      take(1),
      tap((posts) => {
        if (isPlatformServer(platformId)) {
          transferState.set(POSTS_TRANSFER_KEY, posts);
        }
      }),
    );
  };
}
