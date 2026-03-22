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

const themeServiceSnippet = `import { ThemeService } from '@foliokit/cms-ui';

@Component({ ... })
export class MyComponent {
  private readonly theme = inject(ThemeService);

  toggleTheme(): void {
    this.theme.toggle();
  }

  get isDark(): boolean {
    return this.theme.isDark();
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
      <h2 id="shell-config">SHELL_CONFIG</h2>
      <p>
        Provide <code>SHELL_CONFIG</code> with a <code>ShellConfig</code> value anywhere in
        your provider tree. <code>AppShellComponent</code> injects it to configure the layout.
      </p>
      <docs-api-table [rows]="shellConfigRows" />
    </section>

    <section class="mt-10">
      <h2 id="slots">Content Slots</h2>
      <docs-api-table [rows]="slotsRows" />
    </section>

    <section class="mt-10">
      <h2 id="theme-service">ThemeService</h2>
      <p>
        Inject <code>ThemeService</code> to programmatically toggle the theme or read
        the current dark-mode state.
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
