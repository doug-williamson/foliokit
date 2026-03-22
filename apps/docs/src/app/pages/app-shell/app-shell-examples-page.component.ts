import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsPreviewComponent } from '@foliokit/docs-ui';
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
  selector: 'docs-basic-shell-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent],
  providers: [{ provide: SHELL_CONFIG, useValue: basicConfig }],
  template: `<folio-app-shell />`,
})
class BasicShellPreviewComponent {}

@Component({
  selector: 'docs-auth-slot-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent],
  providers: [{ provide: SHELL_CONFIG, useValue: authConfig }],
  template: `<folio-app-shell />`,
})
class AuthSlotPreviewComponent {}

@Component({
  selector: 'docs-app-shell-examples-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DocsPageHeaderComponent,
    DocsPreviewComponent,
    BasicShellPreviewComponent,
    AuthSlotPreviewComponent,
  ],
  template: `
    <docs-page-header />

    <h2>Live Examples</h2>

    <h3>Basic Shell</h3>
    <docs-preview [code]="basicShellCode">
      <docs-basic-shell-preview />
    </docs-preview>

    <h3>With Auth Slot</h3>
    <docs-preview [code]="authSlotCode">
      <docs-auth-slot-preview />
    </docs-preview>
  `,
})
export class AppShellExamplesPageComponent {
  protected readonly basicShellCode = basicShellCode;
  protected readonly authSlotCode = authSlotCode;
}
