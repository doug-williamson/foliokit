import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DocsPageHeaderComponent, DocsPreviewComponent } from '@foliokit/docs-ui';
import { RhombusCodeBlockComponent } from '@rhombuskit/core';
import { AppShellComponent, SHELL_CONFIG, ShellConfig } from '@foliokit/cms-ui';

const previewConfig: ShellConfig = {
  appName: 'FolioKit Blog',
  showAuth: true,
};

@Component({
  selector: 'docs-shell-config-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent],
  providers: [{ provide: SHELL_CONFIG, useValue: signal(previewConfig) }],
  template: `<folio-app-shell />`,
})
class ShellConfigPreviewComponent {}

const shellConfigInterface = `// From @foliokit/cms-ui
import type { Signal } from '@angular/core';

export interface ShellConfig {
  appName: string;
  logoUrl?: string;
  showAuth?: boolean;
  showNewPostButton?: boolean;
  showRouteTitle?: boolean;
  toolbarHomeRoute?: string;
  sidenavMobileMaxPx?: number;
}

// Navigation is projected into the shell's [shellNav] content slot — it is
// not part of ShellConfig.
export const SHELL_CONFIG = new InjectionToken<Signal<ShellConfig>>('SHELL_CONFIG');`;

const usageCode = `import { signal } from '@angular/core';
import { SHELL_CONFIG, ShellConfig } from '@foliokit/cms-ui';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    {
      provide: SHELL_CONFIG,
      useValue: signal<ShellConfig>({
        appName: 'FolioKit Blog',
        logoUrl: '/assets/logo.svg',
        showAuth: true,
      }),
    },
  ],
};`;

const navCode = `<!-- Provide navigation via the [shellNav] content slot -->
<folio-app-shell>
  <nav shellNav>
    <a routerLink="/">Home</a>
    <a routerLink="/blog">Blog</a>
    <a routerLink="/about">About</a>
  </nav>
  <router-outlet />
</folio-app-shell>`;

@Component({
  selector: 'docs-shell-config-token-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, RhombusCodeBlockComponent, DocsPreviewComponent, ShellConfigPreviewComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="live-preview" class="mat-headline-small">Live Preview</h2>
      <p class="mat-body-medium mb-4">A shell configured via <code>SHELL_CONFIG</code> with an app name and auth slot:</p>
      <docs-preview [code]="usageCode">
        <docs-shell-config-preview />
      </docs-preview>
    </section>

    <section class="mt-8">
      <h2 id="interface" class="mat-headline-small">ShellConfig interface</h2>
      <rhombus-code-block [code]="shellConfigInterface" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="navigation" class="mat-headline-small">Navigation</h2>
      <p class="mat-body-medium">Navigation links are projected into the shell's <code>[shellNav]</code> content slot, not configured on <code>SHELL_CONFIG</code>:</p>
      <rhombus-code-block [code]="navCode" language="html" />
    </section>

    <section class="mt-8">
      <h2 id="usage" class="mat-headline-small">Usage</h2>
      <p class="mat-body-medium">Provide <code>SHELL_CONFIG</code> in your root <code>appConfig</code> providers:</p>
      <rhombus-code-block [code]="usageCode" language="typescript" />
    </section>
  `,
})
export class ShellConfigTokenPageComponent {
  protected readonly shellConfigInterface = shellConfigInterface;
  protected readonly navCode = navCode;
  protected readonly usageCode = usageCode;
}
