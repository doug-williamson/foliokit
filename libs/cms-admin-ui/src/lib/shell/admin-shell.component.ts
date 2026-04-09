import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppShellComponent, SHELL_CONFIG, ShellNavFooterDirective } from '@foliokit/cms-ui';
import { AuthService } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

/**
 * Pre-built admin shell layout with opinionated navigation.
 *
 * Wraps `AppShellComponent` (the FolioKit responsive shell) and provides:
 * - **Write** nav group: Posts, Series, Authors
 * - **Publish** nav group: Pages
 * - **Configure** nav group: Appearance, Settings
 * - Footer row with the signed-in user's email and a logout button
 *
 * `SHELL_CONFIG` is provided internally from the `appName` input — you do **not**
 * need to provide it separately in your route or app config.
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
function adminShellConfigFactory(shell: AdminShellComponent) {
  return computed(() => ({
    appName: shell.appName(),
    showNewPostButton: true,
    showRouteTitle: true,
  }));
}

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
    MatTooltipModule,
    ShellNavFooterDirective,
  ],
  providers: [
    SiteConfigEditorStore,
    {
      provide: SHELL_CONFIG,
      useFactory: adminShellConfigFactory,
      deps: [AdminShellComponent],
    },
  ],
  template: `
    <folio-app-shell>
      <nav shellNav>
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="home" />
          <span class="nav-label">Home</span>
        </a>

        <span class="nav-group-label">Write</span>
        <a class="nav-item" routerLink="/posts" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="article" />
          <span class="nav-label">Posts</span>
        </a>
        <a class="nav-item" routerLink="/series" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="collections_bookmark" />
          <span class="nav-label">Series</span>
          <span class="nav-plan-badge nav-plan-badge--pro">PRO</span>
        </a>
        <a class="nav-item" routerLink="/authors" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="people" />
          <span class="nav-label">Authors</span>
        </a>

        <span class="nav-group-label">Publish</span>
        <a class="nav-item" routerLink="/pages" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="web" />
          <span class="nav-label">Pages</span>
        </a>
        <span class="nav-group-label">Configure</span>
        <a class="nav-item" routerLink="/appearance" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="palette" />
          <span class="nav-label">Appearance</span>
        </a>
        <a class="nav-item" routerLink="/settings" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="tune" />
          <span class="nav-label">Settings</span>
        </a>
      </nav>
      <ng-container shellNavFooter>
        <div class="flex items-center justify-between pl-4 pr-2 py-2">
          <span class="text-xs truncate" style="color: var(--text-muted)">{{ auth.user()?.email }}</span>
          <button mat-icon-button (click)="logout()" aria-label="Sign out">
            <mat-icon svgIcon="logout" />
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

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
