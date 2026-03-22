import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsPreviewComponent, DocsPreviewDefinition } from '@foliokit/docs-ui';
import { AppShellComponent, SHELL_CONFIG, ShellConfig } from '@foliokit/cms-ui';

const basicShellCode = `<folio-app-shell>
  <nav shellNav>
    <a routerLink="/">Home</a>
    <a routerLink="/blog">Blog</a>
  </nav>
  <router-outlet />
</folio-app-shell>

// In providers:
{
  provide: SHELL_CONFIG,
  useValue: {
    appName: 'My App',
    nav: [
      { label: 'Home', url: '/' },
      { label: 'Blog', url: '/blog' },
    ],
  } satisfies ShellConfig,
}`;

const authSlotCode = `<folio-app-shell>
  <button shellAuthSlot mat-icon-button>
    <mat-icon>account_circle</mat-icon>
  </button>
  <router-outlet />
</folio-app-shell>

// In providers:
{
  provide: SHELL_CONFIG,
  useValue: {
    appName: 'My App',
    showAuth: true,
    nav: [{ label: 'Home', url: '/' }],
  } satisfies ShellConfig,
}`;

const basicConfig: ShellConfig = {
  appName: 'My App',
  nav: [
    { label: 'Home', url: '/' },
    { label: 'Blog', url: '/blog' },
  ],
};

const authConfig: ShellConfig = {
  appName: 'My App',
  showAuth: true,
  nav: [{ label: 'Home', url: '/' }],
};

@Component({
  selector: 'docs-app-shell-examples-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsPreviewComponent],
  template: `
    <docs-page-header />

    <h2>Live Examples</h2>
    <docs-preview [previews]="previews" />
  `,
})
export class AppShellExamplesPageComponent {
  protected readonly previews: DocsPreviewDefinition[] = [
    {
      label: 'Basic Shell',
      component: AppShellComponent,
      providers: [{ provide: SHELL_CONFIG, useValue: basicConfig }],
      code: basicShellCode,
      viewports: [
        { label: 'Desktop', width: 1200 },
        { label: 'Mobile', width: 375 },
      ],
    },
    {
      label: 'With Auth Slot',
      component: AppShellComponent,
      providers: [{ provide: SHELL_CONFIG, useValue: authConfig }],
      code: authSlotCode,
    },
  ];
}
