import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';
import { ShellLayoutComponent } from './shell-layout/shell-layout.component';
import { PageEditorStore, PostEditorStore } from '@foliokit/cms-admin-ui';

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
          import('@foliokit/cms-admin-ui').then((m) => m.PostsListComponent),
      },
      {
        path: 'posts/new',
        loadComponent: () =>
          import('./post-editor/post-editor.component').then((m) => m.PostEditorComponent),
        providers: [PostEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'posts/:id/edit',
        loadComponent: () =>
          import('./post-editor/post-editor.component').then((m) => m.PostEditorComponent),
        providers: [PostEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'pages',
        loadComponent: () =>
          import('./pages/pages-list.component').then((m) => m.PagesListComponent),
      },
      {
        path: 'pages/new',
        loadComponent: () =>
          import('./pages/page-editor-shell.component').then((m) => m.PageEditorShellComponent),
        providers: [PageEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'pages/:id',
        loadComponent: () =>
          import('./pages/page-editor-shell.component').then((m) => m.PageEditorShellComponent),
        providers: [PageEditorStore],
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
