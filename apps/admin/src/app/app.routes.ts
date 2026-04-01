import { Route } from '@angular/router';
import { adminRoutes } from '@foliokit/cms-admin-ui';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'error',
    loadComponent: () =>
      import('./error/error.component').then((m) => m.ErrorComponent),
  },
  ...adminRoutes.filter((r) => r.path !== 'login'),
];
