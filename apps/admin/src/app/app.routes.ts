import { Route } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { unsavedChangesGuard } from './guards/unsaved-changes.guard';
import { ShellLayoutComponent } from './shell-layout/shell-layout.component';
import { AuthorEditorStore, PostEditorStore, SiteConfigEditorStore } from '@foliokit/cms-admin-ui';

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
        path: 'authors',
        loadComponent: () =>
          import('./authors/authors-list.component').then((m) => m.AuthorsListComponent),
      },
      {
        path: 'authors/new',
        loadComponent: () =>
          import('./authors/author-form.component').then((m) => m.AuthorFormComponent),
        providers: [AuthorEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'authors/:id/edit',
        loadComponent: () =>
          import('./authors/author-form.component').then((m) => m.AuthorFormComponent),
        providers: [AuthorEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'site-config',
        loadComponent: () =>
          import('./site-config/site-config.component').then((m) => m.SiteConfigComponent),
        providers: [SiteConfigEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      { path: '**', redirectTo: 'posts' },
    ],
  },
];
