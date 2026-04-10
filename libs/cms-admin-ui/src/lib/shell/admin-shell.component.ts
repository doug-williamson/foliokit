import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AppShellComponent, SHELL_CONFIG, ShellNavFooterDirective } from '@foliokit/cms-ui';
import { AuthService, SiteConfigService } from '@foliokit/cms-core';

/**
 * Pre-built admin shell layout with opinionated navigation.
 *
 * Wraps `AppShellComponent` (the FolioKit responsive shell) and provides:
 * - **Write** nav group: Posts, Series, Authors
 * - **Publish** nav group: Pages
 * - **Configure** nav group: Settings
 * - Footer row with the signed-in user's email and a logout button
 *
 * `SHELL_CONFIG` is provided internally: toolbar **appName** prefers a non-empty
 * **siteName** from the tenant's Firestore site-config document (via
 * {@link SiteConfigService}), then falls back to the `appName` input. Optional
 * **logo** from site config maps to `logoUrl` in the shell.
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
  return computed(() => {
    const branding = shell.siteToolbarBranding();
    const fallback = shell.appName();
    const fromSite = branding?.siteName?.trim();
    const appName =
      fromSite && fromSite.length > 0 ? fromSite : fallback;
    const logoUrl = branding?.logoUrl?.trim();
    return {
      appName,
      ...(logoUrl ? { logoUrl } : {}),
      showNewPostButton: false,
      showRouteTitle: true,
      toolbarHomeRoute: '/dashboard',
    };
  });
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
    MatTooltipModule,
    ShellNavFooterDirective,
  ],
  providers: [
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
        <a class="nav-item" routerLink="/authors" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="people" />
          <span class="nav-label">Authors</span>
        </a>
        <a class="nav-item" routerLink="/series" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="collections_bookmark" />
          <span class="nav-label">Series</span>
          <span class="nav-plan-badge nav-plan-badge--pro">PRO</span>
        </a>

        <span class="nav-group-label">Publish</span>
        <a class="nav-item" routerLink="/pages" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="web" />
          <span class="nav-label">Pages</span>
        </a>
        @if (aboutPageEnabled()) {
          <a
            class="nav-item nav-child"
            routerLink="/pages/about"
            routerLinkActive="active-link"
          >
            <mat-icon class="nav-icon" svgIcon="info" />
            <span class="nav-label">About</span>
          </a>
        } @else {
          <span
            class="nav-item nav-child nav-item--disabled"
            tabindex="0"
            matTooltip="Enable the About page under Pages"
            matTooltipPosition="right"
          >
            <mat-icon class="nav-icon" svgIcon="info" />
            <span class="nav-label">About</span>
          </span>
        }
        @if (linksPageEnabled()) {
          <a
            class="nav-item nav-child"
            routerLink="/pages/links"
            routerLinkActive="active-link"
          >
            <mat-icon class="nav-icon" svgIcon="link" />
            <span class="nav-label">Links</span>
          </a>
        } @else {
          <span
            class="nav-item nav-child nav-item--disabled"
            tabindex="0"
            matTooltip="Enable the Links page under Pages"
            matTooltipPosition="right"
          >
            <mat-icon class="nav-icon" svgIcon="link" />
            <span class="nav-label">Links</span>
          </span>
        }
        <span class="nav-group-label">Configure</span>
        <a class="nav-item" routerLink="/settings" routerLinkActive="active-link">
          <mat-icon class="nav-icon" svgIcon="tune" />
          <span class="nav-label">Settings</span>
        </a>
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
  `,
})
export class AdminShellComponent {
  /**
   * Application name shown in the shell toolbar when Firestore `siteName` is
   * missing or empty.
   * @default 'FolioKit Admin'
   */
  readonly appName = input<string>('FolioKit Admin');

  /**
   * Populated from the default site-config document for the current `SITE_ID`.
   * Consumed by the `SHELL_CONFIG` factory for this component.
   */
  readonly siteToolbarBranding = signal<{
    siteName?: string;
    logoUrl?: string;
  } | null>(null);

  /** About page enabled in site config (default false when unknown). */
  readonly aboutPageEnabled = signal(false);
  /** Links page enabled in site config (default false when unknown). */
  readonly linksPageEnabled = signal(false);

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    inject(SiteConfigService)
      .watchDefaultSiteConfig()
      .pipe(takeUntilDestroyed())
      .subscribe((config) => {
        if (!config) {
          this.siteToolbarBranding.set(null);
          this.aboutPageEnabled.set(false);
          this.linksPageEnabled.set(false);
          return;
        }
        const siteName = config.siteName?.trim();
        const logoUrl = config.logo?.trim();
        this.siteToolbarBranding.set({
          ...(siteName ? { siteName } : {}),
          ...(logoUrl ? { logoUrl } : {}),
        });
        this.aboutPageEnabled.set(config.pages?.about?.enabled === true);
        this.linksPageEnabled.set(config.pages?.links?.enabled === true);
      });
  }

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
