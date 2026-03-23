import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsCodeBlockComponent } from '@foliokit/docs-ui';

const themeServiceSnippet = `import { ThemeService } from '@foliokit/cms-ui';

@Component({ ... })
export class HeaderComponent {
  readonly theme = inject(ThemeService);
}`;

const themeServiceTemplate = `<button mat-icon-button (click)="theme.toggle()">
  <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
</button>`;

const dataDarkMode = `<!-- Set by ThemeService.toggle() on <html> -->
<html data-theme="dark">
  <!-- all descendants receive dark M3 tokens -->
</html>`;

const tailwindDarkConfig = `// tailwind.config.js
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  // ...
};

// Usage in templates:
// class="bg-white dark:bg-slate-900"`;

@Component({
  selector: 'docs-app-shell-theming-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsCodeBlockComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="theme-service" class="mat-headline-small">ThemeService</h2>
      <p class="mat-body-medium">
        <code>ThemeService</code> (from <code>@foliokit/cms-ui</code>) manages the
        <code>data-theme</code> attribute on the <code>&lt;html&gt;</code> element.
        Inject it anywhere to read or toggle the current theme.
      </p>
      <docs-code-block [code]="themeServiceSnippet" language="typescript" />
      <docs-code-block [code]="themeServiceTemplate" language="html" />
    </section>

    <section class="mt-8">
      <h2 id="css-vars" class="mat-headline-small">CSS Variables</h2>
      <p class="mat-body-medium">
        FolioKit components use Angular Material's <code>--mat-sys-*</code> custom properties
        for all colors. Key tokens used internally:
      </p>
      <ul class="list-disc list-inside space-y-1 mt-2" style="color: var(--mat-sys-on-surface-variant)">
        <li><code>--mat-sys-primary</code> — brand accent color</li>
        <li><code>--mat-sys-surface</code> — page background</li>
        <li><code>--mat-sys-surface-container</code> — card / sidenav surface</li>
        <li><code>--mat-sys-on-surface</code> — default text color</li>
        <li><code>--mat-sys-on-surface-variant</code> — secondary text</li>
        <li><code>--mat-sys-outline-variant</code> — subtle borders and dividers</li>
      </ul>
    </section>

    <section class="mt-8">
      <h2 id="dark-mode" class="mat-headline-small">Dark Mode</h2>
      <p class="mat-body-medium">
        Dark mode is activated by adding <code>data-theme="dark"</code> to the
        <code>&lt;html&gt;</code> element. Angular Material then applies the dark color
        scheme and Tailwind's dark-mode selector activates dark utilities.
      </p>
      <docs-code-block [code]="dataDarkMode" language="html" />
      <docs-code-block [code]="tailwindDarkConfig" language="javascript" />
    </section>
  `,
})
export class AppShellThemingPageComponent {
  protected readonly themeServiceSnippet = themeServiceSnippet;
  protected readonly themeServiceTemplate = themeServiceTemplate;
  protected readonly dataDarkMode = dataDarkMode;
  protected readonly tailwindDarkConfig = tailwindDarkConfig;
}
