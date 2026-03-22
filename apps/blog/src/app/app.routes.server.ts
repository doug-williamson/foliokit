import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'posts', renderMode: RenderMode.Server },
  { path: 'posts/:slug', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'links', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Client },
];
