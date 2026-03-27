import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppShellComponent, SHELL_CONFIG, ShellNavFooterDirective } from '@foliokit/cms-ui';
import { AuthService } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

/**
 * Pre-built admin shell layout with opinionated navigation.
 *
 * Wraps `AppShellComponent` (the FolioKit responsive shell) and provides:
 * - **Content** nav group: Posts, Authors
 * - **Site** nav group: Site Config, Pages, About (when enabled), Links (when enabled)
 * - Footer row with the signed-in user's email and a logout button
 *
 * `SHELL_CONFIG` is provided internally from the `appName` input — you do **not**
 * need to provide it separately in your route or app config.
 *
 * Conditionally shows the About and Links nav items based on whether those
 * pages are enabled in the site configuration (read from `SiteConfigEditorStore`).
 *
 * @example
 * ```ts
 * // In adminRoutes — the shell is the parent route component
 * {
 *   path: '',
 *   component: AdminShellComponent,
 *   canActivate: [authGuard, setupGuard],
 *   children: [ ... ],
 * }
 * ```
 */
@Component({
  selector: 'folio-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppShellComponent,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    ShellNavFooterDirective,
  ],
  providers: [
    SiteConfigEditorStore,
    {
      provide: SHELL_CONFIG,
      useFactory: () => ({ appName: inject(AdminShellComponent).appName() }),
    },
  ],
  template: `
    <folio-app-shell>
      <nav shellNav>
        <span class="nav-group-label">Content</span>
        <a class="nav-item" routerLink="/posts" routerLinkActive="active-link">
          <mat-icon class="nav-icon">article</mat-icon>
          <span class="nav-label">Posts</span>
        </a>
        <a class="nav-item" routerLink="/authors" routerLinkActive="active-link">
          <mat-icon class="nav-icon">people</mat-icon>
          <span class="nav-label">Authors</span>
        </a>

        <span class="nav-group-label">Site</span>
        <a class="nav-item" routerLink="/site-config" routerLinkActive="active-link">
          <mat-icon class="nav-icon">settings</mat-icon>
          <span class="nav-label">Site Config</span>
        </a>
        <a class="nav-item" routerLink="/pages" routerLinkActive="active-link">
          <mat-icon class="nav-icon">auto_stories</mat-icon>
          <span class="nav-label">Pages</span>
        </a>
        @if (pages()?.about?.enabled) {
          <a class="nav-item" routerLink="/about-page" routerLinkActive="active-link">
            <mat-icon class="nav-icon">person</mat-icon>
            <span class="nav-label">About</span>
          </a>
        }
        @if (pages()?.links?.enabled) {
          <a class="nav-item" routerLink="/links-page" routerLinkActive="active-link">
            <mat-icon class="nav-icon">link</mat-icon>
            <span class="nav-label">Links</span>
          </a>
        }
      </nav>
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
export class AdminShellComponent {
  /**
   * Application name shown in the shell toolbar.
   * Forwarded to `SHELL_CONFIG.appName`.
   * @default 'FolioKit Admin'
   */
  readonly appName = input<string>('FolioKit Admin');

  protected readonly store = inject(SiteConfigEditorStore);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly pages = computed(() => this.store.config()?.pages);

  constructor() {
    this.store.load();
  }

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
