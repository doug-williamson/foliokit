import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { AppShellComponent, SHELL_CONFIG, ShellNavFooterDirective } from '@foliokit/cms-ui';
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
 * `SHELL_CONFIG` is provided internally: toolbar **appName** prefers a non-empty
 * **siteName** from the tenant's Firestore site-config document, then falls back
 * to the `appName` input. Optional **logo** from site config maps to `logoUrl`.
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
function adminShellConfigFactory(shell: AdminShellComponent) {
  return computed(() => {
    const c = shell.navStore.config();
    const fallback = shell.appName();
    const fromSite = c?.siteName?.trim();
    const appName =
      fromSite && fromSite.length > 0 ? fromSite : fallback;
    const logoUrl = c?.logo?.trim();
    return {
      appName,
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
    RouterOutlet,
    MatIconModule,
    ShellNavFooterDirective,
    AdminNavComponent,
    MatBottomSheetModule,
  ],
  styles: [
    `
      :host ::ng-deep mat-sidenav .nav-group-label.nav-group-label--disabled {
        opacity: 0.45;
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
  `,
})
export class AdminShellComponent {
  /**
   * Application name shown in the shell toolbar when Firestore `siteName` is
   * missing or empty.
   * @default 'FolioKit Admin'
   */
  readonly appName = input<string>('FolioKit Admin');

  readonly navStore = inject(SiteConfigNavStore);

  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected async logout(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
