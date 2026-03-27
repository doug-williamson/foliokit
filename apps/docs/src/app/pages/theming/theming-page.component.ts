import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  DocsPageHeaderComponent,
  DocsCalloutComponent,
  DocsCodeBlockComponent,
  DocsApiTableComponent,
  ApiTableRow,
} from '@foliokit/docs-ui';

const tokenRows: ApiTableRow[] = [
  { name: '--bg', type: 'color', description: 'Page background', required: false },
  { name: '--bg-subtle', type: 'color', description: 'Subtle background variant', required: false },
  { name: '--surface-0', type: 'color', description: 'Base surface (cards, panels)', required: false },
  { name: '--surface-1', type: 'color', description: 'Elevated surface layer 1', required: false },
  { name: '--surface-2', type: 'color', description: 'Elevated surface layer 2', required: false },
  { name: '--surface-3', type: 'color', description: 'Elevated surface layer 3', required: false },
  { name: '--text-primary', type: 'color', description: 'Primary text color', required: false },
  { name: '--text-secondary', type: 'color', description: 'Secondary text color', required: false },
  { name: '--text-muted', type: 'color', description: 'Muted/disabled text', required: false },
  { name: '--text-accent', type: 'color', description: 'Accent text (links, highlights)', required: false },
  { name: '--btn-primary-bg', type: 'color', description: 'Primary button background', required: false },
  { name: '--btn-primary-text', type: 'color', description: 'Primary button text', required: false },
  { name: '--btn-primary-hover', type: 'color', description: 'Primary button hover state', required: false },
  { name: '--logo-bg', type: 'color', description: 'Logo mark background', required: false },
  { name: '--logo-text', type: 'color', description: 'Logo mark text', required: false },
  { name: '--logo-dot', type: 'color', description: 'Logo dot accent', required: false },
  { name: '--border', type: 'color', description: 'Default border color', required: false },
  { name: '--border-strong', type: 'color', description: 'Strong border color', required: false },
  { name: '--shadow-sm', type: 'shadow', description: 'Small elevation shadow', required: false },
  { name: '--shadow-md', type: 'shadow', description: 'Medium elevation shadow', required: false },
  { name: '--shadow-lg', type: 'shadow', description: 'Large elevation shadow', required: false },
  { name: '--font-display', type: 'font-family', description: 'Display/heading font stack', required: false },
  { name: '--font-body', type: 'font-family', description: 'Body text font stack', required: false },
  { name: '--font-mono', type: 'font-family', description: 'Monospace font stack', required: false },
  { name: '--r-sm', type: 'length', description: 'Small border radius (4px)', required: false },
  { name: '--r-md', type: 'length', description: 'Medium border radius (6px)', required: false },
  { name: '--r-lg', type: 'length', description: 'Large border radius (10px)', required: false },
  { name: '--r-2xl', type: 'length', description: 'Extra-large border radius (20px)', required: false },
];

const overrideExample = `/* src/styles.scss — after tokens.css import */

/* Override specific tokens for your brand */
[data-theme="light"] {
  --logo-dot: #FF6B35;           /* Your brand accent */
  --btn-primary-bg: #FF6B35;
  --btn-primary-hover: #E55A2B;
  --text-accent: #FF6B35;
  --nav-active-bg: rgba(255, 107, 53, 0.08);
  --nav-active-color: #FF6B35;
}

[data-theme="dark"] {
  --logo-dot: #FF8A5C;
  --btn-primary-bg: #FF8A5C;
  --btn-primary-hover: #FF6B35;
  --text-accent: #FF8A5C;
  --nav-active-bg: rgba(255, 138, 92, 0.14);
  --nav-active-color: #FF8A5C;
}`;

const themeServiceCode = `import { ThemeService, ColorScheme } from '@foliokit/cms-ui';

// In any component or service:
readonly theme = inject(ThemeService);

// Read current scheme
const current: ColorScheme = this.theme.scheme();  // 'light' | 'dark'

// Toggle between light and dark
this.theme.toggle();

// Set explicitly
this.theme.setScheme('dark');`;

@Component({
  selector: 'docs-theming-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DocsPageHeaderComponent,
    DocsCalloutComponent,
    DocsCodeBlockComponent,
    DocsApiTableComponent,
  ],
  template: `
    <docs-page-header />

    <section>
      <h2 id="how-it-works" class="mat-headline-small">How It Works</h2>
      <p class="mat-body-medium">
        FolioKit's design system is built entirely on CSS custom properties. The
        <code>tokens.css</code> file defines a base color palette in <code>:root</code> and
        semantic tokens in <code>[data-theme="light"]</code> / <code>[data-theme="dark"]</code>
        selectors. Theme switching is instant — no Angular change detection or recompilation needed.
      </p>
      <p class="mat-body-medium mt-2">
        <code>ThemeService</code> manages the <code>data-theme</code> attribute on
        <code>&lt;html&gt;</code>, persists the user's preference to <code>localStorage</code>
        (key: <code>folio-theme</code>), and falls back to the OS
        <code>prefers-color-scheme</code> media query.
      </p>
    </section>

    <section class="mt-8">
      <h2 id="token-reference" class="mat-headline-small">Token Reference</h2>
      <p class="mat-body-medium">
        All semantic tokens resolve against the active <code>[data-theme]</code> attribute.
        Override any of them in your global stylesheet to customise the look.
      </p>
      <docs-api-table [rows]="tokenRows" />
    </section>

    <section class="mt-8">
      <h2 id="custom-overrides" class="mat-headline-small">Custom Theme Overrides</h2>
      <p class="mat-body-medium">
        Override tokens in your global <code>styles.scss</code>, <em>after</em> importing
        <code>tokens.css</code> via <code>angular.json</code>. The cascade ensures your values
        win. Both light and dark variants should be overridden for consistency.
      </p>
      <docs-code-block [code]="overrideExample" language="scss" />
      <docs-callout variant="tip">
        The <a href="https://github.com/doug-williamson/foliokit-demo-stark" target="_blank" rel="noopener noreferrer">
        Iron Man demo</a> uses this technique to shift the logo dot to an arc-reactor cyan.
      </docs-callout>
    </section>

    <section class="mt-8">
      <h2 id="theme-service" class="mat-headline-small">ThemeService API</h2>
      <docs-code-block [code]="themeServiceCode" language="typescript" />
      <p class="mat-body-medium mt-4">
        <code>ThemeService</code> is <code>providedIn: 'root'</code> — no additional provider
        setup needed. <code>AppShellComponent</code> calls <code>theme.apply()</code> on init
        and includes a built-in toggle button.
      </p>
    </section>
  `,
})
export class ThemingPageComponent {
  protected readonly tokenRows = tokenRows;
  protected readonly overrideExample = overrideExample;
  protected readonly themeServiceCode = themeServiceCode;
}
