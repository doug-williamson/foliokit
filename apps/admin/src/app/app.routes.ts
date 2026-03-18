import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';
import { ShellLayoutComponent } from './shell-layout/shell-layout.component';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'posts', pathMatch: 'full' },
      {
        path: 'posts',
        loadComponent: () =>
          import('./post-list/post-list.component').then((m) => m.PostListComponent),
      },
      {
        path: 'posts/new',
        loadComponent: () =>
          import('./post-editor/post-editor.component').then((m) => m.PostEditorComponent),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'posts/:id/edit',
        loadComponent: () =>
          import('./post-editor/post-editor.component').then((m) => m.PostEditorComponent),
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'site-config',
        loadComponent: () =>
          import('./site-config/site-config.component').then((m) => m.SiteConfigComponent),
      },
      { path: '**', redirectTo: 'posts' },
    ],
  },
];
