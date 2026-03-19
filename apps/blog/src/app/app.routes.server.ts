import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Client },
  { path: 'posts/:slug', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
