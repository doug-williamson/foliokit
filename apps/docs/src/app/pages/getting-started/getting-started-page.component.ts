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
  { label: 'npm',  content: 'npm install @foliokit/cms-ui @foliokit/cms-core' },
  { label: 'yarn', content: 'yarn add @foliokit/cms-ui @foliokit/cms-core' },
  { label: 'pnpm', content: 'pnpm add @foliokit/cms-ui @foliokit/cms-core' },
];

const firebaseJson = `{
  "hosting": {
    "site": "foliokit-prod",
    "public": "dist/apps/docs/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "function": "ssrServer" }]
  }
}`;

const appConfigSnippet = `import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { SHELL_CONFIG } from '@foliokit/cms-ui';
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    {
      provide: SHELL_CONFIG,
      useValue: {
        appName: 'My App',
        nav: [
          { label: 'Home', url: '/' },
          { label: 'Blog', url: '/blog' },
        ],
      },
    },
  ],
};`;

const minimalAppConfig = `export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore()),
    {
      provide: SHELL_CONFIG,
      useValue: {
        appName: 'My App',
        nav: [
          { label: 'Home', url: '/' },
          { label: 'Blog', url: '/blog' },
        ],
      } satisfies ShellConfig,
    },
  ],
};`;

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
      <docs-tabs [tabs]="installTabs" />
    </section>

    <section class="mt-8">
      <h2 id="firebase-setup" class="mat-headline-small">Firebase Setup</h2>
      <docs-callout variant="info">
        FolioKit requires a Firebase project with Firestore and Firebase Hosting enabled.
        Create one at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">console.firebase.google.com</a>
        before proceeding.
      </docs-callout>
      <p class="mat-body-medium mt-4">Configure Firebase Hosting in <code>firebase.json</code>:</p>
      <docs-code-block [code]="firebaseJson" language="json" />
    </section>

    <section class="mt-8">
      <h2 id="app-config" class="mat-headline-small">App Config</h2>
      <p class="mat-body-medium">Wire up Firebase and <code>SHELL_CONFIG</code> in your <code>app.config.ts</code>:</p>
      <docs-code-block [code]="minimalAppConfig" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="next-steps" class="mat-headline-small">Next Steps</h2>
      <p class="mat-body-medium">
        Now that you have FolioKit installed, explore the main layout component:
        <a routerLink="/docs/app-shell">AppShellComponent</a> — or jump straight to
        building a links page with <a routerLink="/docs/links-page">LinksPageComponent</a>.
      </p>
    </section>
  `,
})
export class GettingStartedPageComponent {
  protected readonly installTabs = installTabs;
  protected readonly firebaseJson = firebaseJson;
  protected readonly appConfigSnippet = appConfigSnippet;
  protected readonly minimalAppConfig = minimalAppConfig;
}
