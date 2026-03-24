import { Route } from '@angular/router';
import { postsResolver } from './resolvers/posts.resolver';
import { postResolver } from './resolvers/post.resolver';
import { pageResolver } from './resolvers/page.resolver';
import { aboutPageResolver } from './resolvers/about-page.resolver';
import { featureGuard } from './guards/feature.guard';

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
    canActivate: [featureGuard('aboutEnabled')],
    resolve: { about: aboutPageResolver },
    loadComponent: () =>
      import('./features/about/blog-about-page.component').then(
        (m) => m.BlogAboutPageComponent,
      ),
  },
  {
    path: 'links',
    canActivate: [featureGuard('linksEnabled')],
    data: { pageId: 'links' },
    resolve: { page: pageResolver },
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
