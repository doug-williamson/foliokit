import { Route, ResolveFn } from '@angular/router';
import { Type } from '@angular/core';
import type { BlogPost, AboutPageConfig, LinksPageConfig } from '@foliokit/cms-core';
import { createPostsResolver, createAboutPageResolver, createLinksPageResolver, featureGuard } from '@foliokit/cms-core';

/**
 * Well-known path segments for routes produced by {@link createBlogRoutes}.
 * Use these constants when patching or augmenting the route array rather than
 * comparing against magic strings.
 */
export const BLOG_ROUTE_PATHS = {
  home: '',
  posts: 'posts',
  postDetail: 'posts/:slug',
  about: 'about',
  links: 'links',
  notFound: 'not-found',
} as const;

/**
 * Configuration accepted by {@link createBlogRoutes}.
 *
 * Each resolver is optional — sensible defaults from `@foliokit/cms-core` are
 * used when omitted. Only override a resolver when your app needs custom
 * TransferState logic, pre-fetching, or server-side data access patterns.
 *
 * Component overrides let you substitute any page with your own standalone
 * component while keeping the library resolvers and guards in place:
 *
 * ```ts
 * createBlogRoutes({ aboutComponent: MyAboutPage, postResolver })
 * ```
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

  /**
   * Override the home page component.
   * @default BlogHomeComponent
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  homeComponent?: Type<any>;

  /**
   * Override the about page component. Receives `{ about: AboutPageConfig | null }`
   * in its route data, identical to the default component.
   * @default BlogAboutPageComponent
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aboutComponent?: Type<any>;

  /**
   * Override the links page component. Receives `{ page: LinksPageConfig | null }`
   * in its route data, identical to the default component.
   * @default LinksPageComponent
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  linksComponent?: Type<any>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveComponent<T extends Type<any>>(
  override: T | undefined,
  defaultLoader: () => Promise<T>,
): () => Promise<T> {
  return override ? () => Promise.resolve(override) : defaultLoader;
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
      path: BLOG_ROUTE_PATHS.home,
      pathMatch: 'full',
      loadComponent: resolveComponent(
        config?.homeComponent,
        () => import('../home/blog-home.component').then((m) => m.BlogHomeComponent),
      ),
    },
    {
      path: BLOG_ROUTE_PATHS.posts,
      loadComponent: () =>
        import('../post-list/blog-post-list.component').then((m) => m.BlogPostListComponent),
      resolve: { posts: postsResolver },
    },
    {
      path: BLOG_ROUTE_PATHS.notFound,
      loadComponent: () =>
        import('../not-found/not-found.component').then((m) => m.NotFoundComponent),
    },
    {
      path: BLOG_ROUTE_PATHS.about,
      canActivate: [featureGuard('about')],
      resolve: { about: aboutPageResolver },
      loadComponent: resolveComponent(
        config?.aboutComponent,
        () => import('../about-page/blog-about-page.component').then((m) => m.BlogAboutPageComponent),
      ),
    },
    {
      path: BLOG_ROUTE_PATHS.links,
      title: 'Links | FolioKit',
      canActivate: [featureGuard('links')],
      resolve: { page: linksPageResolver },
      loadComponent: resolveComponent(
        config?.linksComponent,
        () => import('../links-page/links-page.component').then((m) => m.LinksPageComponent),
      ),
    },
    {
      path: '**',
      loadComponent: () =>
        import('../not-found/not-found.component').then((m) => m.NotFoundComponent),
    },
  ];

  if (config?.postResolver) {
    routes.splice(2, 0, {
      path: BLOG_ROUTE_PATHS.postDetail,
      loadComponent: () =>
        import('../post-detail/blog-post-detail.component').then((m) => m.BlogPostDetailComponent),
      resolve: { post: config.postResolver },
    });
  }

  return routes;
}
