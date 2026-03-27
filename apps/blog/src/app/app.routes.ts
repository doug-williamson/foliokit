import { Route } from '@angular/router';
import { createAboutPageResolver, createLinksPageResolver, createPostsResolver } from '@foliokit/cms-core';
import { postResolver } from './resolvers/post.resolver';
import { featureGuard } from './guards/feature.guard';

const postsResolver = createPostsResolver();
const aboutPageResolver = createAboutPageResolver();
const linksPageResolver = createLinksPageResolver();

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'posts',
    loadComponent: () =>
      import('./features/post-list/post-list.component').then(
        (m) => m.PostListComponent,
      ),
    resolve: { posts: postsResolver },
  },
  {
    path: 'posts/:slug',
    loadComponent: () =>
      import('./features/post-detail/post-detail.component').then(
        (m) => m.PostDetailComponent,
      ),
    resolve: { post: postResolver },
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
  {
    path: 'about',
    canActivate: [featureGuard('about')],
    resolve: { about: aboutPageResolver },
    loadComponent: () =>
      import('./features/about/blog-about-page.component').then(
        (m) => m.BlogAboutPageComponent,
      ),
  },
  {
    path: 'links',
    canActivate: [featureGuard('links')],
    resolve: { page: linksPageResolver },
    loadComponent: () =>
      import('@foliokit/cms-ui').then((m) => m.LinksPageComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
