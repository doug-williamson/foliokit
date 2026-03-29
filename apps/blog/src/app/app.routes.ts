import type { Route } from '@angular/router';
import { FOLIO_BLOG_ROUTES } from '@foliokit/cms-core';
import { postResolver } from './resolvers/post.resolver';

export const appRoutes: Route[] = [
  // Standard blog routes (home, post-list, about, links, not-found).
  ...FOLIO_BLOG_ROUTES.filter((r) => r.path !== 'posts/:slug'),

  // Post-detail with custom resolver for TransferState / author lookup.
  {
    path: 'posts/:slug',
    loadComponent: () =>
      import('@foliokit/cms-ui').then((m) => m.BlogPostDetailComponent),
    resolve: { post: postResolver },
  },
];
