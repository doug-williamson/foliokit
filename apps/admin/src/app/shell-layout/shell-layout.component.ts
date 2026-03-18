import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppShellComponent, SHELL_CONFIG } from '@foliokit/cms-ui';

@Component({
  selector: 'admin-shell-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent, RouterOutlet, RouterLink, RouterLinkActive],
  providers: [
    {
      provide: SHELL_CONFIG,
      useValue: {
        appName: 'FolioKit Admin',
        nav: [
          { label: 'Posts', url: '/posts' },
          { label: 'Site Config', url: '/site-config' },
        ],
      },
    },
  ],
  template: `
    <folio-app-shell>
      <nav shellNav>
        <a routerLink="/posts" routerLinkActive="active">Posts</a>
        <a routerLink="/site-config" routerLinkActive="active">Site Config</a>
      </nav>
      <router-outlet />
    </folio-app-shell>
  `,
})
export class ShellLayoutComponent {}
