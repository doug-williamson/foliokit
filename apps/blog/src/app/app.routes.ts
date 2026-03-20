import { Route } from '@angular/router';
import { postsResolver } from './resolvers/posts.resolver';
import { postResolver } from './resolvers/post.resolver';

export const appRoutes: Route[] = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'posts',
    loadComponent: () =>
      import('./post-list/post-list.component').then(
        (m) => m.PostListComponent,
      ),
    resolve: { posts: postsResolver },
  },
  {
    path: 'posts/:slug',
    loadComponent: () =>
      import('./post-detail/post-detail.component').then(
        (m) => m.PostDetailComponent,
      ),
    resolve: { post: postResolver },
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
