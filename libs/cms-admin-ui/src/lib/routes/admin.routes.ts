import { Route } from '@angular/router';
import { AuthorEditorStore } from '../author-editor/author-editor.store';
import { PostEditorStore } from '../post-editor/post-editor.store';
import { TaxonomyStore } from '../taxonomy/taxonomy.store';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';
import { authGuard } from '../guards/auth.guard';
import { setupGuard, setupCompleteGuard } from '../guards/setup.guard';
import { unsavedChangesGuard } from '../guards/unsaved-changes.guard';
import { AdminShellComponent } from '../shell/admin-shell.component';

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
    canActivate: [authGuard, setupCompleteGuard],
  },
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [authGuard, setupGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        data: { title: 'Dashboard' },
        loadComponent: () =>
          import('../dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'posts',
        data: { title: 'Posts' },
        loadComponent: () =>
          import('../posts-list/posts-list.component').then((m) => m.PostsListComponent),
      },
      {
        path: 'posts/new',
        data: { title: '' },
        loadComponent: () =>
          import('../post-editor/post-editor-page.component').then(
            (m) => m.PostEditorPageComponent,
          ),
        providers: [PostEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'posts/:id/edit',
        data: { title: '' },
        loadComponent: () =>
          import('../post-editor/post-editor-page.component').then(
            (m) => m.PostEditorPageComponent,
          ),
        providers: [PostEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'authors',
        data: { title: 'Authors' },
        loadComponent: () =>
          import('../author-editor/authors-list.component').then(
            (m) => m.AuthorsListComponent,
          ),
      },
      {
        path: 'authors/new',
        data: { title: '' },
        loadComponent: () =>
          import('../author-editor/author-form.component').then(
            (m) => m.AuthorFormComponent,
          ),
        providers: [AuthorEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      {
        path: 'authors/:id/edit',
        data: { title: '' },
        loadComponent: () =>
          import('../author-editor/author-form.component').then(
            (m) => m.AuthorFormComponent,
          ),
        providers: [AuthorEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      // ── Pages hub + About / Links editors ─────────────────────────────────
      {
        path: 'pages',
        providers: [SiteConfigEditorStore],
        loadComponent: () =>
          import('../pages/pages-shell.component').then((m) => m.PagesShellComponent),
        children: [
          {
            path: '',
            data: { title: 'Configuration' },
            loadComponent: () =>
              import('../pages/pages-hub.component').then((m) => m.PagesHubComponent),
            canDeactivate: [unsavedChangesGuard],
          },
          {
            path: 'home',
            data: { title: 'Home' },
            loadComponent: () =>
              import('../page-editor/home-page-editor.component').then(
                (m) => m.HomePageEditorComponent,
              ),
            canDeactivate: [unsavedChangesGuard],
          },
          {
            path: 'about',
            data: { title: 'About Page' },
            loadComponent: () =>
              import('../page-editor/about-page-editor.component').then(
                (m) => m.AboutPageEditorComponent,
              ),
            canDeactivate: [unsavedChangesGuard],
          },
          {
            path: 'links',
            data: { title: 'Links Page' },
            loadComponent: () =>
              import('../page-editor/links-page-editor.component').then(
                (m) => m.LinksPageEditorComponent,
              ),
            canDeactivate: [unsavedChangesGuard],
          },
          {
            path: 'blog',
            data: { title: 'Publish' },
            loadComponent: () =>
              import('../page-editor/blog-page-editor.component').then(
                (m) => m.BlogPageEditorComponent,
              ),
            canDeactivate: [unsavedChangesGuard],
          },
        ],
      },
      // ── Series (was: /taxonomy) ───────────────────────────────────────────
      { path: 'taxonomy', redirectTo: 'series', pathMatch: 'full' },
      {
        path: 'series',
        data: { title: 'Series' },
        loadComponent: () =>
          import('../taxonomy/taxonomy-page.component').then(
            (m) => m.TaxonomyPageComponent,
          ),
        providers: [TaxonomyStore],
      },
      // ── Settings (site + Pro); legacy paths redirect here ─────────────────
      { path: 'site-config', redirectTo: 'settings', pathMatch: 'full' },
      { path: 'appearance', redirectTo: 'settings', pathMatch: 'full' },
      {
        path: 'settings',
        data: { title: 'Settings' },
        loadComponent: () =>
          import('../site-config-editor/site-config-page.component').then(
            (m) => m.SiteConfigPageComponent,
          ),
        providers: [SiteConfigEditorStore],
        canDeactivate: [unsavedChangesGuard],
      },
      // ── Legacy redirects ──────────────────────────────────────────────────
      { path: 'about', redirectTo: 'pages/about', pathMatch: 'full' },
      { path: 'links', redirectTo: 'pages/links', pathMatch: 'full' },
      { path: 'about-page', redirectTo: 'pages/about', pathMatch: 'full' },
      { path: 'links-page', redirectTo: 'pages/links', pathMatch: 'full' },
      { path: 'navigation', redirectTo: 'settings', pathMatch: 'full' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
