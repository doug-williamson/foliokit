import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AppShellComponent, SHELL_CONFIG } from '@foliokit/cms-ui';

@Component({
  selector: 'admin-shell-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent, RouterOutlet, RouterLink, RouterLinkActive, MatNavList, MatListItem, MatIconModule],
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
          <mat-icon matListItemIcon>article</mat-icon>
          <span matListItemTitle>Posts</span>
        </a>
        <a mat-list-item routerLink="/pages" routerLinkActive="active-link">
          <mat-icon matListItemIcon>pages</mat-icon>
          <span matListItemTitle>Pages</span>
        </a>
        <a mat-list-item routerLink="/authors" routerLinkActive="active-link">
          <mat-icon matListItemIcon>people</mat-icon>
          <span matListItemTitle>Authors</span>
        </a>
        <a mat-list-item routerLink="/site-config" routerLinkActive="active-link">
          <mat-icon matListItemIcon>settings</mat-icon>
          <span matListItemTitle>Site Config</span>
        </a>
      </mat-nav-list>
      <router-outlet />
    </folio-app-shell>
  `,
})
export class ShellLayoutComponent {}
