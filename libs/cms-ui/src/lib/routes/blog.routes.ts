import { Route, ResolveFn } from '@angular/router';
import type { BlogPost, AboutPageConfig, LinksPageConfig } from '@foliokit/cms-core';
import { createPostsResolver, createAboutPageResolver, createLinksPageResolver, featureGuard } from '@foliokit/cms-core';

/**
 * Configuration accepted by {@link createBlogRoutes}.
 *
 * Each resolver is optional — sensible defaults from `@foliokit/cms-core` are
 * used when omitted. Only override a resolver when your app needs custom
 * TransferState logic, pre-fetching, or server-side data access patterns.
 */
export interface BlogRoutesConfig {
  /**
   * Resolver for the posts list page (`/posts`).
   * @default createPostsResolver()
   */
  postsResolver?: ResolveFn<BlogPost[]>;

  /**
   * Resolver for the single-post detail page (`/posts/:slug`).
   * Must place a `{ post, author }` object under the `'post'` route data key.
   * **No default** — you must provide this if you use the post-detail route.
   */
  postResolver?: ResolveFn<unknown>;

  /**
   * Resolver for the about page (`/about`).
   * @default createAboutPageResolver()
   */
  aboutPageResolver?: ResolveFn<AboutPageConfig | null>;

  /**
   * Resolver for the links page (`/links`).
   * @default createLinksPageResolver()
   */
  linksPageResolver?: ResolveFn<LinksPageConfig | null>;
}

/**
 * Creates the complete set of blog routes backed by library UI components.
 *
 * Consumers call this in their `app.routes.ts` and optionally pass custom
 * resolvers for SSR or advanced data loading:
 *
 * ```ts
 * import { createBlogRoutes } from '@foliokit/cms-ui';
 * import { postResolver } from './resolvers/post.resolver';
 *
 * export const appRoutes: Route[] = createBlogRoutes({ postResolver });
 * ```
 */
export function createBlogRoutes(config?: BlogRoutesConfig): Route[] {
  const postsResolver = config?.postsResolver ?? createPostsResolver();
  const aboutPageResolver = config?.aboutPageResolver ?? createAboutPageResolver();
  const linksPageResolver = config?.linksPageResolver ?? createLinksPageResolver();

  const routes: Route[] = [
    {
      path: '',
      pathMatch: 'full',
      loadComponent: () =>
        import('../home/blog-home.component').then((m) => m.BlogHomeComponent),
    },
    {
      path: 'posts',
      loadComponent: () =>
        import('../post-list/blog-post-list.component').then((m) => m.BlogPostListComponent),
      resolve: { posts: postsResolver },
    },
    {
      path: 'not-found',
      loadComponent: () =>
        import('../not-found/not-found.component').then((m) => m.NotFoundComponent),
    },
    {
      path: 'about',
      canActivate: [featureGuard('about')],
      resolve: { about: aboutPageResolver },
      loadComponent: () =>
        import('../about-page/blog-about-page.component').then((m) => m.BlogAboutPageComponent),
    },
    {
      path: 'links',
      title: 'Links | FolioKit',
      canActivate: [featureGuard('links')],
      resolve: { page: linksPageResolver },
      loadComponent: () =>
        import('../links-page/links-page.component').then((m) => m.LinksPageComponent),
    },
    {
      path: '**',
      loadComponent: () =>
        import('../not-found/not-found.component').then((m) => m.NotFoundComponent),
    },
  ];

  if (config?.postResolver) {
    routes.splice(2, 0, {
      path: 'posts/:slug',
      loadComponent: () =>
        import('../post-detail/blog-post-detail.component').then((m) => m.BlogPostDetailComponent),
      resolve: { post: config.postResolver },
    });
  }

  return routes;
}
