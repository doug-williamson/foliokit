import { inject, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn, Router } from '@angular/router';
import { map, switchMap, tap, take } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { BLOG_POST_SERVICE } from '../tokens/post-service.token';
import {
  AUTHOR_SERVICE,
  POST_DETAIL_KEY,
  POST_AUTHOR_KEY,
} from '../tokens/author-service.token';
import type { PostRouteData } from '../models/post.model';

/** Options for {@link createPostDetailResolver}. */
export interface PostDetailResolverOptions {
  /**
   * Whether to fetch the author alongside the post.
   * Requires `AUTHOR_SERVICE` to be provided.
   * @default true
   */
  withAuthor?: boolean;

  /**
   * Route to redirect to when the post is not found.
   * Set to `null` to resolve with `{ post: null, author: null }` instead
   * of redirecting (useful when the component handles the empty state).
   * @default null
   */
  notFoundRoute?: string | null;
}

/**
 * Factory that creates a resolver for the post-detail route.
 *
 * Reads a single post by slug from `BLOG_POST_SERVICE.getPostBySlug()`,
 * using Angular's `TransferState` to avoid a duplicate Firestore read on
 * browser hydration after SSR. Optionally fetches the author via
 * `AUTHOR_SERVICE.getById()` when `withAuthor` is `true` (the default).
 *
 * `BLOG_POST_SERVICE` must be provided in your app — either the default
 * `PostService` (client SDK) or a server-side override (Admin SDK) via
 * `app.config.server.ts`. `AUTHOR_SERVICE` is injected optionally; when
 * absent, `author` resolves to `null`.
 *
 * @example
 * ```ts
 * // app.routes.ts
 * {
 *   path: 'posts/:slug',
 *   resolve: { post: createPostDetailResolver() },
 *   loadComponent: () => import('./post-detail.component').then(m => m.PostDetailComponent),
 * }
 * ```
 */
export function createPostDetailResolver(
  options?: PostDetailResolverOptions,
): ResolveFn<PostRouteData> {
  const withAuthor = options?.withAuthor ?? true;
  const notFoundRoute = options?.notFoundRoute ?? null;

  return (route) => {
    const transferState = inject(TransferState);
    const postService = inject(BLOG_POST_SERVICE);
    const platformId = inject(PLATFORM_ID);
    const authorService = withAuthor
      ? inject(AUTHOR_SERVICE, { optional: true })
      : null;
    const router = notFoundRoute != null ? inject(Router) : null;
    const slug = route.paramMap.get('slug') ?? '';

    const empty: PostRouteData = { post: null, author: null };

    // Browser hydration: use transferred state if available.
    if (transferState.hasKey(POST_DETAIL_KEY)) {
      const post = transferState.get(POST_DETAIL_KEY, null);
      const author = transferState.hasKey(POST_AUTHOR_KEY)
        ? transferState.get(POST_AUTHOR_KEY, null)
        : null;
      transferState.remove(POST_DETAIL_KEY);
      transferState.remove(POST_AUTHOR_KEY);

      if (!post && router && notFoundRoute) {
        return router.createUrlTree([notFoundRoute]) as never;
      }
      return { post, author } as PostRouteData;
    }

    // Helper to wrap author resolution.
    function resolveAuthor(post: NonNullable<PostRouteData['post']>): Observable<PostRouteData> {
      if (!withAuthor || !authorService || !post.authorId) {
        if (isPlatformServer(platformId)) {
          transferState.set(POST_AUTHOR_KEY, null);
        }
        return of({ post, author: null });
      }

      return authorService.getById(post.authorId).pipe(
        take(1),
        tap((author) => {
          if (isPlatformServer(platformId)) {
            transferState.set(POST_AUTHOR_KEY, author);
          }
        }),
        map((author) => ({ post, author })),
      );
    }

    // Fetch post by slug, then optionally fetch author.
    return postService.getPostBySlug(slug).pipe(
      take(1),
      tap((post) => {
        if (isPlatformServer(platformId)) {
          transferState.set(POST_DETAIL_KEY, post);
        }
      }),
      switchMap((post) => {
        if (!post) {
          if (isPlatformServer(platformId)) {
            transferState.set(POST_AUTHOR_KEY, null);
          }
          return of(empty);
        }
        return resolveAuthor(post);
      }),
      map((data) => {
        if (!data.post && router && notFoundRoute) {
          return router.createUrlTree([notFoundRoute]) as never;
        }
        return data;
      }),
    );
  };
}
