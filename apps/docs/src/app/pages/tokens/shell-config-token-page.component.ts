import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsCodeBlockComponent } from '@foliokit/docs-ui';

const shellConfigInterface = `// From @foliokit/cms-ui
import type { NavItem } from '@foliokit/cms-core';

export interface ShellConfig {
  appName: string;
  logoUrl?: string;
  showAuth?: boolean;
  nav?: NavItem[];
}

export const SHELL_CONFIG = new InjectionToken<ShellConfig>('SHELL_CONFIG');`;

const navItemInterface = `// From @foliokit/cms-core
export interface NavItem {
  label: string;
  url: string;
  order?: number;
  external?: boolean;
  icon?: string;
}`;

const usageCode = `import { SHELL_CONFIG, ShellConfig } from '@foliokit/cms-ui';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...
    {
      provide: SHELL_CONFIG,
      useValue: {
        appName: 'FolioKit Blog',
        logoUrl: '/assets/logo.svg',
        showAuth: true,
        nav: [
          { label: 'Home',  url: '/' },
          { label: 'Blog',  url: '/blog' },
          { label: 'About', url: '/about' },
        ],
      } satisfies ShellConfig,
    },
  ],
};`;

@Component({
  selector: 'docs-shell-config-token-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsCodeBlockComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="interface" class="mat-headline-small">ShellConfig interface</h2>
      <docs-code-block [code]="shellConfigInterface" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="nav-item" class="mat-headline-small">NavItem</h2>
      <docs-code-block [code]="navItemInterface" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="usage" class="mat-headline-small">Usage</h2>
      <p class="mat-body-medium">Provide <code>SHELL_CONFIG</code> in your root <code>appConfig</code> providers:</p>
      <docs-code-block [code]="usageCode" language="typescript" />
    </section>
  `,
})
export class ShellConfigTokenPageComponent {
  protected readonly shellConfigInterface = shellConfigInterface;
  protected readonly navItemInterface = navItemInterface;
  protected readonly usageCode = usageCode;
}
