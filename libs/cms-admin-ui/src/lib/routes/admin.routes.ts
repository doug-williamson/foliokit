import { Route } from '@angular/router';
import { AuthorEditorStore } from '../author-editor/author-editor.store';
import { PostEditorStore } from '../post-editor/post-editor.store';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';
import { authGuard } from '../guards/auth.guard';
import { setupGuard } from '../guards/setup.guard';
import { unsavedChangesGuard } from '../guards/unsaved-changes.guard';
import { AdminShellComponent } from '../shell/admin-shell.component';

/**
 * Pre-configured route tree for the FolioKit admin application.
 *
 * Provides the complete admin routing structure out of the box:
 * - `/login` — Google sign-in page (`AdminLoginComponent`)
 * - `/setup` — First-run site setup wizard (`SetupComponent`)
 * - `/` — Admin shell (`AdminShellComponent`) containing:
 *   - `/posts`, `/posts/new`, `/posts/:id/edit` — Post management
 *   - `/authors`, `/authors/new`, `/authors/:id/edit` — Author management
 *   - `/pages` — Pages hub (About / Links feature toggles)
 *   - `/site-config` — Site configuration editor
 *   - `/links-page` — Links page editor
 *   - `/about-page` — About page editor
 *
 * All shell children are protected by `authGuard` + `setupGuard`.
 * All editor routes apply `unsavedChangesGuard` on deactivation.
 *
 * **Usage**
 * ```ts
 * // app.config.ts
 * provideRouter(adminRoutes, withComponentInputBinding())
 * ```
 *
 * **Extending or overriding routes**
 *
 * To add extra routes or replace a specific route, spread and override:
 * ```ts
 * import { adminRoutes } from '@foliokit/cms-admin-ui';
 *
 * export const appRoutes: Route[] = [
 *   ...adminRoutes,
 *   { path: 'custom', loadComponent: () => import('./custom.component') },
 * ];
 * ```
 *
 * To replace only the shell's children, copy the shell route and extend `children`:
 * ```ts
 * const [shellRoute] = adminRoutes.filter(r => r.path === '');
 * export const appRoutes: Route[] = [
 *   ...adminRoutes.filter(r => r.path !== ''),
 *   { ...shellRoute, children: [...shellRoute.children!, { path: 'custom', ... }] },
 * ];
 * ```
 *
 */
export const adminRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('../login/admin-login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: 'setup',
    loadComponent: () =>
      import('../setup/setup.component').then((m) => m.SetupComponent),
    providers: [SiteConfigEditorStore],
    canActivate: [authGuard],
  },
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [authGuard, setupGuard],
    children: [
      { path: '', redirectTo: 'posts', pathMatch: 'full' },
      {
        path: 'posts',
        loadComponent: () =>
          import('../posts-list/posts-list.component').then((m) => m.PostsListComponent),
      },
      {
        path: 'posts/new',
        loadComponent: () =>
          import('../post-editor/post-editor-page.component').then(
            (m) => m.PostEditorPageComponent,
          ),
        providers: [PostEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'posts/:id/edit',
        loadComponent: () =>
          import('../post-editor/post-editor-page.component').then(
            (m) => m.PostEditorPageComponent,
          ),
        providers: [PostEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'authors',
        loadComponent: () =>
          import('../author-editor/authors-list.component').then(
            (m) => m.AuthorsListComponent,
          ),
      },
      {
        path: 'authors/new',
        loadComponent: () =>
          import('../author-editor/author-form.component').then(
            (m) => m.AuthorFormComponent,
          ),
        providers: [AuthorEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'authors/:id/edit',
        loadComponent: () =>
          import('../author-editor/author-form.component').then(
            (m) => m.AuthorFormComponent,
          ),
        providers: [AuthorEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'pages',
        loadComponent: () =>
          import('../pages/admin-pages.component').then((m) => m.AdminPagesComponent),
      },
      {
        path: 'site-config',
        loadComponent: () =>
          import('../site-config-editor/site-config-page.component').then(
            (m) => m.SiteConfigPageComponent,
          ),
        providers: [SiteConfigEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'links-page',
        loadComponent: () =>
          import('../page-editor/links-page-editor.component').then(
            (m) => m.LinksPageEditorComponent,
          ),
        providers: [SiteConfigEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'about-page',
        loadComponent: () =>
          import('../page-editor/about-page-editor.component').then(
            (m) => m.AboutPageEditorComponent,
          ),
        providers: [SiteConfigEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      { path: '**', redirectTo: 'posts' },
    ],
  },
];
