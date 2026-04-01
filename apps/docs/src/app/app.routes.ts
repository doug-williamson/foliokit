import { inject, Type } from '@angular/core';
import { ActivatedRoute, Route } from '@angular/router';
import { DocsShellComponent, DOCS_PAGE_META } from '@foliokit/docs-ui';
import { docsPageMetaResolver } from './resolvers/docs-page-meta.resolver';

function docsRoute(path: string, load: () => Promise<Type<unknown>>): Route {
  return {
    path,
    loadComponent: () => load(),
    resolve: { meta: docsPageMetaResolver },
    providers: [
      {
        provide: DOCS_PAGE_META,
        useFactory: () => inject(ActivatedRoute).snapshot.data['meta'],
        deps: [ActivatedRoute],
      },
    ],
  };
}

export const appRoutes: Route[] = [
  {
    path: '',
    component: DocsShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/landing/landing-page.component').then(m => m.LandingPageComponent),
      },
      {
        path: 'docs',
        children: [
          { path: '', redirectTo: 'getting-started', pathMatch: 'full' },

          // Getting Started
          docsRoute('getting-started', () =>
            import('./pages/getting-started/getting-started-page.component').then(
              m => m.GettingStartedPageComponent,
            ),
          ),
          docsRoute('getting-started/nx', () =>
            import('./pages/getting-started/getting-started-nx-page.component').then(
              m => m.GettingStartedNxPageComponent,
            ),
          ),

          // AppShell
          docsRoute('app-shell', () =>
            import('./pages/app-shell/app-shell-overview-page.component').then(
              m => m.AppShellOverviewPageComponent,
            ),
          ),
          docsRoute('app-shell/api', () =>
            import('./pages/app-shell/app-shell-api-page.component').then(
              m => m.AppShellApiPageComponent,
            ),
          ),
          docsRoute('app-shell/theming', () =>
            import('./pages/app-shell/app-shell-theming-page.component').then(
              m => m.AppShellThemingPageComponent,
            ),
          ),
          docsRoute('app-shell/examples', () =>
            import('./pages/app-shell/app-shell-examples-page.component').then(
              m => m.AppShellExamplesPageComponent,
            ),
          ),

          // LinksPage
          docsRoute('links-page', () =>
            import('./pages/links-page/links-page-overview-page.component').then(
              m => m.LinksPageOverviewPageComponent,
            ),
          ),
          docsRoute('links-page/api', () =>
            import('./pages/links-page/links-page-api-page.component').then(
              m => m.LinksPageApiPageComponent,
            ),
          ),
          docsRoute('links-page/examples', () =>
            import('./pages/links-page/links-page-examples-page.component').then(
              m => m.LinksPageExamplesPageComponent,
            ),
          ),

          // Markdown
          docsRoute('markdown', () =>
            import('./pages/markdown/markdown-overview-page.component').then(
              m => m.MarkdownOverviewPageComponent,
            ),
          ),
          docsRoute('markdown/api', () =>
            import('./pages/markdown/markdown-api-page.component').then(
              m => m.MarkdownApiPageComponent,
            ),
          ),
          docsRoute('markdown/examples', () =>
            import('./pages/markdown/markdown-examples-page.component').then(
              m => m.MarkdownExamplesPageComponent,
            ),
          ),

          // Theming
          docsRoute('theming', () =>
            import('./pages/theming/theming-page.component').then(
              m => m.ThemingPageComponent,
            ),
          ),

          // Firebase
          docsRoute('firebase', () =>
            import('./pages/firebase/firebase-page.component').then(
              m => m.FirebasePageComponent,
            ),
          ),

          // Components — AboutPage
          docsRoute('components/about-page', () =>
            import('./pages/about-page/about-page-docs.component').then(
              m => m.AboutPageDocsComponent,
            ),
          ),

          // Components — LinksPage (alias to existing)
          docsRoute('components/links-page', () =>
            import('./pages/links-page/links-page-overview-page.component').then(
              m => m.LinksPageOverviewPageComponent,
            ),
          ),

          // Components — Markdown (alias to existing)
          docsRoute('components/markdown', () =>
            import('./pages/markdown/markdown-overview-page.component').then(
              m => m.MarkdownOverviewPageComponent,
            ),
          ),

          // Tokens
          docsRoute('tokens', () =>
            import('./pages/tokens/tokens-overview-page.component').then(
              m => m.TokensOverviewPageComponent,
            ),
          ),
          docsRoute('tokens/shell-config', () =>
            import('./pages/tokens/shell-config-token-page.component').then(
              m => m.ShellConfigTokenPageComponent,
            ),
          ),
          docsRoute('tokens/seo-meta', () =>
            import('./pages/tokens/seo-meta-token-page.component').then(
              m => m.SeoMetaTokenPageComponent,
            ),
          ),
          docsRoute('tokens/embedded-media', () =>
            import('./pages/tokens/embedded-media-token-page.component').then(
              m => m.EmbeddedMediaTokenPageComponent,
            ),
          ),
        ],
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./pages/signup/signup.component').then(m => m.SignupComponent),
        title: 'Get Started — FolioKit',
      },
      {
        path: '**',
        loadComponent: () =>
          import('./pages/not-found/not-found-page.component').then(m => m.NotFoundPageComponent),
      },
    ],
  },
];
