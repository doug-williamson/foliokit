import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DocsPageHeaderComponent,
  DocsTabsComponent,
  DocsCalloutComponent,
  DocsCodeBlockComponent,
  DocsTab,
} from '@foliokit/docs-ui';

const installTabs: DocsTab[] = [
  { label: 'npm',  content: 'npm install @foliokit/cms-core @foliokit/cms-ui @foliokit/cms-markdown' },
  { label: 'yarn', content: 'yarn add @foliokit/cms-core @foliokit/cms-ui @foliokit/cms-markdown' },
  { label: 'pnpm', content: 'pnpm add @foliokit/cms-core @foliokit/cms-ui @foliokit/cms-markdown' },
];

const appConfigCode = `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import { provideFolioKit } from '@foliokit/cms-core';
import { SHELL_CONFIG } from '@foliokit/cms-ui';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideMarkdown(),
    provideFolioKit({
      firebaseConfig: environment.firebase,
      siteId: 'my-site',          // optional — for multi-site deployments
    }),
    {
      provide: SHELL_CONFIG,
      useValue: {
        appName: 'My App',
        showAuth: false,
        nav: [
          { label: 'Home', url: '/' },
          { label: 'Blog', url: '/blog' },
          { label: 'About', url: '/about' },
        ],
      },
    },
  ],
};`;

const tokensImportCode = `// angular.json (or project.json)
{
  "architect": {
    "build": {
      "options": {
        "styles": [
          "node_modules/@foliokit/cms-ui/styles/tokens.css",
          "src/styles.scss"
        ]
      }
    }
  }
}`;

const materialThemeCode = `// src/styles.scss
@use '@angular/material' as mat;

html, html[data-theme='light'] {
  @include mat.theme((
    color: (theme-type: light, primary: mat.$cyan-palette),
    typography: 'Plus Jakarta Sans',
    density: 0,
  ));
}

html[data-theme='dark'] {
  @include mat.theme((
    color: (theme-type: dark, primary: mat.$cyan-palette),
    typography: 'Plus Jakarta Sans',
    density: 0,
  ));
}`;

const shellComponentCode = `import { AppShellComponent } from '@foliokit/cms-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent, RouterOutlet],
  template: \`
    <folio-app-shell>
      <router-outlet />
    </folio-app-shell>
  \`,
})
export class AppComponent {}`;

@Component({
  selector: 'docs-getting-started-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DocsPageHeaderComponent,
    DocsTabsComponent,
    DocsCalloutComponent,
    DocsCodeBlockComponent,
  ],
  template: `
    <docs-page-header />

    <section>
      <h2 id="installation" class="mat-headline-small">Installation</h2>
      <p class="mat-body-medium">Install the core libraries:</p>
      <docs-tabs [tabs]="installTabs" />
    </section>

    <section class="mt-8">
      <h2 id="tokens" class="mat-headline-small">Import Design Tokens</h2>
      <p class="mat-body-medium">
        Add the FolioKit token stylesheet to your <code>angular.json</code> styles array.
        This ships the full CSS custom property contract (colors, typography, radii, shadows):
      </p>
      <docs-code-block [code]="tokensImportCode" language="json" />
    </section>

    <section class="mt-8">
      <h2 id="material-theme" class="mat-headline-small">Angular Material Theme</h2>
      <docs-callout variant="warning">
        Angular Material M3 theming <strong>must be configured in your global stylesheet</strong>.
        It cannot be bundled inside a library. If you skip this, Material components render without
        colour or typography.
      </docs-callout>
      <docs-code-block [code]="materialThemeCode" language="scss" />
    </section>

    <section class="mt-8">
      <h2 id="app-config" class="mat-headline-small">Wire provideFolioKit()</h2>
      <p class="mat-body-medium">
        <code>provideFolioKit()</code> is the single-call bootstrapper. It registers Firebase
        (app, Firestore, Storage, Auth), binds the default <code>PostService</code> and
        <code>SiteConfigService</code>, and optionally stores a <code>siteId</code>.
      </p>
      <docs-code-block [code]="appConfigCode" language="typescript" />
      <docs-callout variant="tip">
        The default service bindings can be overridden. Add your own provider <em>after</em>
        <code>provideFolioKit()</code> in the array — Angular's DI uses last-provider-wins.
      </docs-callout>
    </section>

    <section class="mt-8">
      <h2 id="shell" class="mat-headline-small">Wrap Your App in the Shell</h2>
      <p class="mat-body-medium">
        Import <code>AppShellComponent</code> and use it as the root layout:
      </p>
      <docs-code-block [code]="shellComponentCode" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="next-steps" class="mat-headline-small">Next Steps</h2>
      <p class="mat-body-medium">
        Explore the <a routerLink="/docs/app-shell">AppShellComponent</a> slots and theming,
        set up a <a routerLink="/docs/firebase">Firebase project</a>,
        or check out the <a routerLink="/docs/theming">design token system</a>.
        For a complete working example, see the
        <a href="https://github.com/doug-williamson/foliokit-demo-stark" target="_blank" rel="noopener noreferrer">
          Iron Man demo repo</a>.
      </p>
    </section>
  `,
})
export class GettingStartedPageComponent {
  protected readonly installTabs = installTabs;
  protected readonly tokensImportCode = tokensImportCode;
  protected readonly materialThemeCode = materialThemeCode;
  protected readonly appConfigCode = appConfigCode;
  protected readonly shellComponentCode = shellComponentCode;
}
