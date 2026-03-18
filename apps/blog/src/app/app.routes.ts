import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'posts',
    loadComponent: () =>
      import('./post-list/post-list.component').then(
        (m) => m.PostListComponent,
      ),
  },
  {
    path: 'posts/:slug',
    loadComponent: () =>
      import('./post-detail/post-detail.component').then(
        (m) => m.PostDetailComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
