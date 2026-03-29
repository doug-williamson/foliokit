import type { Routes } from '@angular/router';
import { FOLIO_BLOG_ROUTES } from '@foliokit/cms-core';

export const routes: Routes = [
  { path: '', children: [...FOLIO_BLOG_ROUTES] },
  { path: '**', redirectTo: '' },
];
