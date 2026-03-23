import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DocsPageHeaderComponent,
  DocsTabsComponent,
  DocsCodeBlockComponent,
  DocsApiTableComponent,
  DocsTab,
  ApiTableRow,
} from '@foliokit/docs-ui';

const installTabs: DocsTab[] = [
  { label: 'npm',  content: 'npm install @foliokit/cms-ui' },
  { label: 'yarn', content: 'yarn add @foliokit/cms-ui' },
  { label: 'pnpm', content: 'pnpm add @foliokit/cms-ui' },
];

const basicUsage = `import { AppShellComponent } from '@foliokit/cms-ui';
import { SHELL_CONFIG, ShellConfig } from '@foliokit/cms-ui';

@Component({
  template: \`
    <folio-app-shell>
      <nav shellNav>
        <a routerLink="/home">Home</a>
        <a routerLink="/blog">Blog</a>
      </nav>

      <!-- Routed content renders here -->
      <router-outlet />
    </folio-app-shell>
  \`,
  providers: [
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
})
export class AppComponent {}`;

const slotsRows: ApiTableRow[] = [
  { name: 'shellHeaderActions', type: 'ng-content slot', description: 'Extra action buttons rendered on the right side of the header.' },
  { name: 'shellAuthSlot',      type: 'ng-content slot', description: 'Avatar or auth UI, displayed in the header when showAuth is true.' },
  { name: 'shellNav',           type: 'ng-content slot', description: 'Navigation links projected into the sidenav.' },
  { name: '(default)',          type: 'ng-content slot', description: 'Routed page content rendered in the main content area.' },
];

@Component({
  selector: 'docs-app-shell-overview-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsPageHeaderComponent,
    DocsTabsComponent,
    DocsCodeBlockComponent,
    DocsApiTableComponent,
  ],
  template: `
    <docs-page-header />

    <section>
      <h2 id="overview" class="mat-headline-small">Overview</h2>
      <p class="mat-body-medium">
        <code>AppShellComponent</code> (<code>folio-app-shell</code>) is the top-level layout
        for FolioKit apps. It provides a Material sidenav, a branded header with optional auth
        slot, theme toggle, and responsive mobile drawer. All configuration is driven by the
        <code>SHELL_CONFIG</code> injection token — no inputs required.
      </p>
    </section>

    <section class="mt-8">
      <h2 id="installation" class="mat-headline-small">Installation</h2>
      <docs-tabs [tabs]="installTabs" />
    </section>

    <section class="mt-8">
      <h2 id="basic-usage" class="mat-headline-small">Basic Usage</h2>
      <docs-code-block [code]="basicUsage" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="slots" class="mat-headline-small">Content Slots</h2>
      <p class="mat-body-medium">
        <code>AppShellComponent</code> exposes four <code>ng-content</code> projection slots:
      </p>
      <docs-api-table [rows]="slotsRows" />
    </section>
  `,
})
export class AppShellOverviewPageComponent {
  protected readonly installTabs = installTabs;
  protected readonly basicUsage = basicUsage;
  protected readonly slotsRows = slotsRows;
}
