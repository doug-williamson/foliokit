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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  RhombusAppShellComponent,
  RhombusShellNavFooterDirective,
} from '@rhombuskit/core';
import { FolioThemeControlComponent, SHELL_CONFIG } from '@foliokit/cms-ui';
import { AuthService } from '@foliokit/cms-core';
import { AdminNavComponent } from './admin-nav.component';
import { SiteConfigNavStore } from '../stores/site-config-nav.store';

/**
 * Pre-built admin shell layout with opinionated navigation.
 *
 * Wraps `RhombusAppShellComponent` (the RhombusKit responsive shell) and provides:
 * - **Pages-first** nav via {@link AdminNavComponent} (Pages, Publish, Configure)
 *   projected into the shell's `[shellNav]` slot
 * - Brand (logo + "FolioKit Admin") in `[shellBrand]`, linking to `/dashboard`
 * - A theme control in `[shellHeaderActions]`
 * - Footer row with the signed-in user's email and a logout button in
 *   `[shellNavFooter]`
 *
 * When the tenant has not yet completed setup (`isOnboarding` is true), a
 * minimal full-bleed layout renders instead: a branded toolbar (no sidenav,
 * no hamburger) above the content area. Once all four pages are enabled the
 * normal rhombus-app-shell takes over reactively.
 *
 * `SHELL_CONFIG` is still provided (other FolioKit shell consumers read it);
 * admin now drives the brand and the mobile breakpoint from local constants.
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
const ADMIN_SIDENAV_MOBILE_MAX_PX = 959;

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
      sidenavMobileMaxPx: ADMIN_SIDENAV_MOBILE_MAX_PX,
    };
  });
}

@Component({
  selector: 'folio-admin-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RhombusAppShellComponent,
    RhombusShellNavFooterDirective,
    RouterLink,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatToolbarModule,
    AdminNavComponent,
    MatBottomSheetModule,
    FolioThemeControlComponent,
  ],
  styles: [
    `
      /* ── Shell brand (projected into rhombus-app-shell [shellBrand]) ──
         Re-homed from folio-app-shell's toolbar brand styling. */
      .folio-shell-brand {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        text-decoration: none;
        color: inherit;
        border-radius: var(--r-sm);

        &:focus-visible {
          outline: 2px solid var(--focus-border);
          outline-offset: 2px;
        }

        &:hover .folio-app-name {
          color: var(--text-accent);
        }

        .folio-logo-mark {
          position: relative;
          width: 30px;
          height: 30px;
          background: var(--logo-bg);
          border-radius: var(--r-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .folio-logo-mark-f {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 900;
          color: var(--logo-text);
          line-height: 1;
        }

        .folio-logo-dot {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--logo-dot);
        }

        .folio-app-name {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.04em;
          margin-left: 6px;
          white-space: nowrap;
        }

        .folio-custom-logo {
          height: 32px;
          width: auto;
          object-fit: contain;
          display: block;
          flex-shrink: 0;
        }
      }

      /* ── Nav-footer sign-out button (projected into [shellNavFooter]) ──
         Re-homed from folio-app-shell's app-shell.component.scss. Plain button
         (not mat-icon-button) so MDC does not force a ~24px icon. */
      :host ::ng-deep .nav-footer-signout {
        flex-shrink: 0;
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: var(--r-sm);
        transition: background 0.12s, color 0.12s;

        &:hover {
          background: var(--surface-2);
          color: var(--text-primary);
        }

        &:focus-visible {
          outline: 2px solid var(--text-accent);
          outline-offset: 2px;
        }

        .nav-icon {
          font-size: 18px !important;
          width: 18px !important;
          height: 18px !important;
          line-height: 18px !important;

          svg {
            width: 18px !important;
            height: 18px !important;
            display: block;
          }
        }
      }

      /* ── Onboarding full-bleed layout (unchanged) ── */
      .onboarding-shell {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--bg);
      }

      .onboarding-toolbar {
        flex-shrink: 0;
        background: var(--surface-1);
        border-bottom: var(--border-width) solid var(--border);
        color: var(--text-primary);

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
          border-radius: var(--r-md);
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

      :host-context([data-theme='dark']) .onboarding-toolbar {
        background: var(--surface-1);
        border-bottom-color: var(--border);
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
          <folio-theme-control />
        </mat-toolbar>
        <main class="onboarding-main">
          <router-outlet />
        </main>
      </div>
    } @else {
      <rhombus-app-shell [mobileBreakpoint]="sidenavMobileMaxPx">
        <a
          shellBrand
          class="folio-shell-brand"
          routerLink="/dashboard"
          [attr.aria-label]="'Go to dashboard — ' + appName"
        >
          @if (logoUrl(); as logo) {
            <img class="folio-custom-logo" [src]="logo" [alt]="appName" />
          } @else {
            <div class="folio-logo-mark">
              <span class="folio-logo-mark-f">F</span>
              <div class="folio-logo-dot"></div>
            </div>
          }
          <span class="folio-app-name">{{ appName }}</span>
        </a>
        <folio-theme-control shellHeaderActions />
        <nav shellNav>
          <folio-admin-nav />
        </nav>
        <ng-container shellNavFooter>
          <div class="flex items-center justify-between pl-3 pr-1 py-1">
            <span class="text-xs truncate" style="color: var(--text-muted)" [matTooltip]="auth.user()?.email ?? ''" [matTooltipDisabled]="true" matTooltipPosition="right">{{ auth.user()?.email }}</span>
            <button type="button" class="nav-footer-signout" (click)="logout()" aria-label="Sign out" matTooltip="Sign out" matTooltipPosition="right" [matTooltipDisabled]="true">
              <mat-icon class="nav-icon" svgIcon="logout" />
            </button>
          </div>
        </ng-container>
        <router-outlet />
      </rhombus-app-shell>
    }
  `,
})
export class AdminShellComponent {
  readonly navStore = inject(SiteConfigNavStore);

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly appName = ADMIN_TOOLBAR_APP_NAME;
  protected readonly sidenavMobileMaxPx = ADMIN_SIDENAV_MOBILE_MAX_PX;
  protected readonly logoUrl = computed(
    () => this.navStore.config()?.logo?.trim() || null,
  );

  readonly isOnboarding = computed(() => {
    if (!this.navStore.isLoaded()) return false;
    return !this.navStore.config()?.onboardingComplete;
  });

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
