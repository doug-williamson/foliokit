import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppShellComponent, SHELL_CONFIG, ShellNavFooterDirective } from '@foliokit/cms-ui';
import { AuthService, PlanGatingService } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

/**
 * Pre-built admin shell layout with opinionated navigation.
 *
 * Wraps `AppShellComponent` (the FolioKit responsive shell) and provides:
 * - **Content** nav group: Posts, Authors
 * - **Site** nav group: Site Config, Pages, About (nested child, when enabled), Links (nested child, when enabled)
 * - Footer row with the signed-in user's email and a logout button
 *
 * `SHELL_CONFIG` is provided internally from the `appName` input — you do **not**
 * need to provide it separately in your route or app config.
 *
 * Conditionally shows the About and Links nav items (visually nested under Pages)
 * based on whether those pages are enabled in the site configuration
 * (read from `SiteConfigEditorStore`).
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
  return computed(() => ({ appName: shell.appName() }));
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
        <span class="nav-group-label">Content</span>
        <a class="nav-item" routerLink="/posts" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="article" />
          <span class="nav-label">Posts</span>
        </a>
        <a class="nav-item" routerLink="/authors" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="people" />
          <span class="nav-label">Authors</span>
        </a>
        <a class="nav-item" routerLink="/taxonomy" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="category" />
          <span class="nav-label">Taxonomy</span>
          @if (!hasTaxonomy()) {
            <mat-icon
              class="nav-icon"
              svgIcon="lock"
              style="font-size: 0.85rem; width: 0.85rem; height: 0.85rem; opacity: 0.55; margin-left: auto"
              matTooltip="Available on Pro"
              matTooltipPosition="right"
            />
          }
        </a>

        <span class="nav-group-label">Site</span>
        <a class="nav-item" routerLink="/site-config" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="settings" />
          <span class="nav-label">Site Config</span>
        </a>
        <a class="nav-item" routerLink="/pages" routerLinkActive="active-link" [routerLinkActiveOptions]="{ exact: true }">
          <mat-icon class="nav-icon" svgIcon="auto_stories" />
          <span class="nav-label">Pages</span>
        </a>
        @if (pages()?.about?.enabled) {
          <a class="nav-item nav-child" routerLink="/pages/about" routerLinkActive="active-link">
            <mat-icon class="nav-icon" svgIcon="person" />
            <span class="nav-label">About</span>
          </a>
        }
        @if (pages()?.links?.enabled) {
          <a class="nav-item nav-child" routerLink="/pages/links" routerLinkActive="active-link">
            <mat-icon class="nav-icon" svgIcon="link" />
            <span class="nav-label">Links</span>
          </a>
        }
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

  protected readonly store = inject(SiteConfigEditorStore);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly planGating = inject(PlanGatingService);
  protected readonly pages = computed(() => this.store.config()?.pages);
  protected readonly hasTaxonomy = this.planGating.hasPlatformFeature('taxonomy');

  constructor() {
    this.store.load();
  }

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
