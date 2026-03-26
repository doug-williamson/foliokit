import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppShellComponent, SHELL_CONFIG, ShellNavFooterDirective } from '@foliokit/cms-ui';
import { SiteConfigEditorStore } from '@foliokit/cms-admin-ui';
import { AuthService } from '@foliokit/cms-core';

@Component({
  selector: 'admin-shell-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppShellComponent, RouterOutlet, RouterLink, RouterLinkActive, MatNavList, MatListItem, MatBadgeModule, MatIconModule, MatButtonModule, ShellNavFooterDirective],
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
        <a mat-list-item routerLink="/setup" routerLinkActive="active-link">
          <span class="flex items-center gap-4">
            <mat-icon
              [matBadge]="setupIncomplete() || null"
              matBadgeColor="warn"
              matBadgeSize="small"
            >checklist</mat-icon>
            <span>Setup</span>
          </span>
        </a>
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
            <span class="flex items-center gap-4 pl-6">
              <mat-icon>person</mat-icon>
              <span>About</span>
            </span>
          </a>
        }
        @if (pages()?.links?.enabled) {
          <a mat-list-item routerLink="/links-page" routerLinkActive="active-link">
            <span class="flex items-center gap-4 pl-6">
              <mat-icon>link</mat-icon>
              <span>Links</span>
            </span>
          </a>
        }
      </mat-nav-list>
      <ng-container shellNavFooter>
        <div class="flex items-center justify-between pl-4 pr-2 py-2">
          <span class="text-xs truncate" style="color: var(--text-muted)">{{ auth.user()?.email }}</span>
          <button mat-icon-button (click)="logout()" aria-label="Sign out">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </ng-container>
      <router-outlet />
    </folio-app-shell>
  `,
})
export class ShellLayoutComponent {
  protected readonly store = inject(SiteConfigEditorStore);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly pages = computed(() => this.store.config()?.pages);

  /** Number of incomplete setup steps (null when all done, so the badge hides). */
  protected readonly setupIncomplete = computed(() => {
    const config = this.store.config();
    if (!config) return null;
    let incomplete = 0;
    if (!config.siteName?.trim()) incomplete++;
    if (!config.pages?.home?.heroHeadline?.trim()) incomplete++;
    if ((config.nav?.length ?? 0) === 0) incomplete++;
    const aboutEnabled = config.pages?.about?.enabled ?? false;
    if (aboutEnabled && !config.pages?.about?.headline?.trim()) incomplete++;
    const linksEnabled = config.pages?.links?.enabled ?? false;
    if (linksEnabled && (config.pages?.links?.links?.length ?? 0) === 0) incomplete++;
    return incomplete > 0 ? incomplete : null;
  });

  constructor() {
    this.store.load();
  }

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
