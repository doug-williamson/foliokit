import { Routes } from '@angular/router';
import { postsResolver } from './resolvers/posts.resolver';
import { postResolver } from './resolvers/post.resolver';
import { aboutResolver } from './resolvers/about.resolver';
import { linksResolver } from './resolvers/links.resolver';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'blog',
    loadComponent: () =>
      import('./features/post-list/post-list.component').then((m) => m.PostListComponent),
    resolve: { posts: postsResolver },
  },
  {
    path: 'blog/:slug',
    loadComponent: () =>
      import('./features/post-detail/post-detail.component').then((m) => m.PostDetailComponent),
    resolve: { post: postResolver },
  },
  {
    path: 'about',
    resolve: { about: aboutResolver },
    loadComponent: () =>
      import('@foliokit/cms-ui').then((m) => m.AboutPageComponent),
  },
  {
    path: 'links',
    resolve: { page: linksResolver },
    loadComponent: () =>
      import('@foliokit/cms-ui').then((m) => m.LinksPageComponent),
  },
  { path: '**', redirectTo: '' },
];
