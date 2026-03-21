import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatNavList, MatListItem } from '@angular/material/list';
import { AppShellComponent, SHELL_CONFIG } from '@foliokit/cms-ui';

@Component({
  selector: 'admin-shell-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent, RouterOutlet, RouterLink, RouterLinkActive, MatNavList, MatListItem],
  providers: [
    {
      provide: SHELL_CONFIG,
      useValue: {
        appName: 'FolioKit Admin',
        nav: [
          { label: 'Posts', url: '/posts' },
          { label: 'Pages', url: '/pages' },
          { label: 'Site Config', url: '/site-config' },
        ],
      },
    },
  ],
  template: `
    <folio-app-shell>
      <mat-nav-list shellNav>
        <a mat-list-item routerLink="/posts" routerLinkActive="active-link">
          <span matListItemTitle>Posts</span>
        </a>
        <a mat-list-item routerLink="/pages" routerLinkActive="active-link">
          <span matListItemTitle>Pages</span>
        </a>
        <a mat-list-item routerLink="/site-config" routerLinkActive="active-link">
          <span matListItemTitle>Site Config</span>
        </a>
      </mat-nav-list>
      <router-outlet />
    </folio-app-shell>
  `,
})
export class ShellLayoutComponent {}
