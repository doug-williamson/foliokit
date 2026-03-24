import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AppShellComponent, SHELL_CONFIG } from '@foliokit/cms-ui';
import { SiteConfigEditorStore } from '@foliokit/cms-admin-ui';

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
      },
    },
  ],
  template: `
    <folio-app-shell>
      <mat-nav-list shellNav>
        <a mat-list-item routerLink="/site-config" routerLinkActive="active-link">
          <span class="flex items-center gap-4">
            <mat-icon>settings</mat-icon>
            <span>Site Config</span>
          </span>
        </a>
        <a mat-list-item routerLink="/posts" routerLinkActive="active-link">
          <span class="flex items-center gap-4">
            <mat-icon>article</mat-icon>
            <span>Posts</span>
          </span>
        </a>
        <a mat-list-item routerLink="/authors" routerLinkActive="active-link">
          <span class="flex items-center gap-4">
            <mat-icon>people</mat-icon>
            <span>Authors</span>
          </span>
        </a>
        <a mat-list-item routerLink="/pages" routerLinkActive="active-link">
          <span class="flex items-center gap-4">
            <mat-icon>auto_stories</mat-icon>
            <span>Pages</span>
          </span>
        </a>
        @if (pages()?.about?.enabled) {
          <a mat-list-item routerLink="/about-page" routerLinkActive="active-link">
            <span class="flex items-center gap-4 pl-8">
              <mat-icon>person</mat-icon>
              <span>About</span>
            </span>
          </a>
        }
        @if (pages()?.links?.enabled) {
          <a mat-list-item routerLink="/links-page" routerLinkActive="active-link">
            <span class="flex items-center gap-4 pl-8">
              <mat-icon>link</mat-icon>
              <span>Links</span>
            </span>
          </a>
        }
      </mat-nav-list>
      <router-outlet />
    </folio-app-shell>
  `,
})
export class ShellLayoutComponent {
  protected readonly store = inject(SiteConfigEditorStore);
  protected readonly pages = computed(() => this.store.config()?.pages);

  constructor() {
    this.store.load();
  }
}
