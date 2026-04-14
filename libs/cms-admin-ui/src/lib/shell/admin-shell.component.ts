import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AppShellComponent, SHELL_CONFIG, ShellNavFooterDirective, ThemeService } from '@foliokit/cms-ui';
import { AuthService } from '@foliokit/cms-core';
import { AdminNavComponent } from './admin-nav.component';
import { SiteConfigNavStore } from '../stores/site-config-nav.store';

/**
 * Pre-built admin shell layout with opinionated navigation.
 *
 * Wraps `AppShellComponent` (the FolioKit responsive shell) and provides:
 * - **Pages-first** nav via {@link AdminNavComponent} (Pages, Publish, Configure)
 * - Footer row with the signed-in user's email and a logout button
 *
 * When the tenant has not yet completed setup (`isOnboarding` is true), a
 * minimal full-bleed layout renders instead: a branded toolbar (no sidenav,
 * no hamburger) above the content area. Once all four pages are enabled the
 * normal folio-app-shell takes over reactively.
 *
 * `SHELL_CONFIG` is provided internally: toolbar **appName** is always
 * `"FolioKit Admin"`. Optional **logo** from site config maps to `logoUrl`.
 *
 * @example
 * ```ts
 * // In adminRoutes — the shell is the parent route component
 * {
 *   path: '',
 *   component: AdminShellComponent,
 *   canActivate: [authGuard],
 *   children: [ ... ],
 * }
 * ```
 */
const ADMIN_TOOLBAR_APP_NAME = 'FolioKit Admin';

function adminShellConfigFactory(shell: AdminShellComponent) {
  return computed(() => {
    const c = shell.navStore.config();
    const logoUrl = c?.logo?.trim();
    return {
      appName: ADMIN_TOOLBAR_APP_NAME,
      ...(logoUrl ? { logoUrl } : {}),
      showNewPostButton: false,
      showRouteTitle: true,
      toolbarHomeRoute: '/dashboard',
      sidenavMobileMaxPx: 959,
    };
  });
}

@Component({
  selector: 'folio-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppShellComponent,
    RouterLink,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    ShellNavFooterDirective,
    AdminNavComponent,
    MatBottomSheetModule,
  ],
  styles: [
    `
      :host ::ng-deep mat-sidenav .nav-group-label.nav-group-label--disabled {
        opacity: 0.45;
      }

      .onboarding-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--bg);
      }

      .onboarding-toolbar {
        flex-shrink: 0;
        border-bottom: 1px solid var(--border);
        background: var(--surface-0);

        .folio-toolbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: inherit;
        }

        .folio-logo-mark {
          width: 28px;
          height: 28px;
          background: var(--logo-bg);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
        }

        .folio-logo-mark-f {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          color: var(--logo-text);
          line-height: 1;
        }

        .folio-logo-dot {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--logo-dot);
        }

        .folio-app-name {
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.01em;
        }

        .flex-1 {
          flex: 1;
        }
      }

      .onboarding-main {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
  providers: [
    SiteConfigNavStore,
    {
      provide: SHELL_CONFIG,
      useFactory: adminShellConfigFactory,
      deps: [AdminShellComponent],
    },
  ],
  template: `
    @if (isOnboarding()) {
      <div class="onboarding-shell">
        <mat-toolbar class="onboarding-toolbar">
          <a class="folio-toolbar-brand" routerLink="/dashboard" aria-label="FolioKit Admin">
            <div class="folio-logo-mark">
              <span class="folio-logo-mark-f">F</span>
              <div class="folio-logo-dot"></div>
            </div>
            <span class="folio-app-name">FolioKit Admin</span>
          </a>
          <span class="flex-1"></span>
          <button
            mat-icon-button
            [attr.aria-label]="theme.scheme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            (click)="theme.toggle()"
          >
            <mat-icon [svgIcon]="theme.scheme() === 'dark' ? 'light_mode' : 'dark_mode'" />
          </button>
        </mat-toolbar>
        <main class="onboarding-main">
          <router-outlet />
        </main>
      </div>
    } @else {
      <folio-app-shell>
        <nav shellNav>
          <folio-admin-nav />
        </nav>
        <ng-container shellNavFooter>
          <div class="flex items-center justify-between pl-3 pr-1 py-1">
            <span class="text-xs truncate" style="color: var(--text-muted)">{{ auth.user()?.email }}</span>
            <button type="button" class="nav-footer-signout" (click)="logout()" aria-label="Sign out">
              <mat-icon class="nav-icon" svgIcon="logout" />
            </button>
          </div>
        </ng-container>
        <router-outlet />
      </folio-app-shell>
    }
  `,
})
export class AdminShellComponent {
  readonly navStore = inject(SiteConfigNavStore);

  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly isOnboarding = computed(() => {
    if (!this.navStore.isLoaded()) return false;
    const pages = this.navStore.config()?.pages;
    return !(
      pages?.home?.enabled &&
      pages?.blog?.enabled &&
      pages?.about?.enabled &&
      pages?.links?.enabled
    );
  });

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
