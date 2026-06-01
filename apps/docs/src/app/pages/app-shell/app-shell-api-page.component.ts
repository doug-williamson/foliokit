import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DocsPageHeaderComponent,
  DocsApiTableComponent,
  DocsCodeBlockComponent,
  ApiTableRow,
} from '@foliokit/docs-ui';

const shellConfigRows: ApiTableRow[] = [
  { name: 'appName',  type: 'string',    required: true,  description: 'Application name displayed in the header.' },
  { name: 'logoUrl',  type: 'string',    required: false, default: 'undefined', description: 'URL for a logo image rendered in the header.' },
  { name: 'nav',      type: 'NavItem[]', required: false, default: '[]',        description: 'Array of navigation items displayed in the sidenav.' },
  { name: 'showAuth', type: 'boolean',   required: false, default: 'false',     description: 'When true, the shellAuthSlot is visible in the header.' },
];

const slotsRows: ApiTableRow[] = [
  { name: 'shellHeaderActions', type: 'ng-content slot', description: 'Extra action buttons rendered on the right side of the header.' },
  { name: 'shellAuthSlot',      type: 'ng-content slot', description: 'Avatar or auth UI, shown when showAuth is true.' },
  { name: 'shellNav',           type: 'ng-content slot', description: 'Navigation links projected into the sidenav.' },
  { name: '(default)',          type: 'ng-content slot', description: 'Routed page content rendered in the main content area.' },
];

const themeServiceSnippet = `import { RhombusThemeService } from '@foliokit/cms-ui';

@Component({ ... })
export class MyComponent {
  private readonly theme = inject(RhombusThemeService);

  // Two-state toggle (light ↔ dark). RhombusThemeService.toggle() cycles
  // light → dark → system; FolioKit stays two-state via setTheme().
  toggleTheme(): void {
    this.theme.setTheme(this.theme.current() === 'dark' ? 'light' : 'dark');
  }

  get isDark(): boolean {
    return this.theme.current() === 'dark';
  }
}`;

@Component({
  selector: 'docs-app-shell-api-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsApiTableComponent, DocsCodeBlockComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="shell-config" class="mat-headline-small">SHELL_CONFIG</h2>
      <p class="mat-body-medium">
        Provide <code>SHELL_CONFIG</code> with a <code>ShellConfig</code> value anywhere in
        your provider tree. <code>AppShellComponent</code> injects it to configure the layout.
      </p>
      <docs-api-table [rows]="shellConfigRows" />
    </section>

    <section class="mt-8">
      <h2 id="slots" class="mat-headline-small">Content Slots</h2>
      <docs-api-table [rows]="slotsRows" />
    </section>

    <section class="mt-8">
      <h2 id="theme-service" class="mat-headline-small">RhombusThemeService</h2>
      <p class="mat-body-medium">
        Inject <code>RhombusThemeService</code> (from <code>@foliokit/cms-ui</code>) to
        programmatically set the theme or read the current resolved scheme. Register
        <code>provideFolioKitTheme()</code> (from <code>@foliokit/cms-ui</code>) in your app config.
      </p>
      <docs-code-block [code]="themeServiceSnippet" language="typescript" />
    </section>
  `,
})
export class AppShellApiPageComponent {
  protected readonly shellConfigRows = shellConfigRows;
  protected readonly slotsRows = slotsRows;
  protected readonly themeServiceSnippet = themeServiceSnippet;
}
