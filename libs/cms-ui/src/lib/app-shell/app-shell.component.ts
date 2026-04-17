import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter, map } from 'rxjs/operators';
import { ActivationEnd, NavigationEnd, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SHELL_CONFIG } from '../shell-config.token';
import { ThemeService } from '../theme.service';
import { ShellNavFooterDirective } from './shell-nav-footer.directive';

const DEFAULT_MOBILE_MAX_PX = 767;
const ICON_RAIL_BP = '(min-width: 768px) and (max-width: 1023.98px)';

@Component({
  selector: 'folio-app-shell',
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    RouterLink,
  ],
})
export class AppShellComponent {
  protected readonly config = inject(SHELL_CONFIG);
  protected readonly theme = inject(ThemeService);

  @ContentChild(ShellNavFooterDirective) protected navFooter?: ShellNavFooterDirective;

  protected readonly isMobile = signal(false);
  readonly isIconRail = signal(false);
  protected readonly sidenavOpen = signal(false);

  private _isMobileInitialized = false;

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);

  /** Current route title, read from route data['title']. Updated on each navigation. */
  protected readonly routeTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is ActivationEnd => e instanceof ActivationEnd),
      map((e) => e.snapshot.data['title'] as string | undefined),
      filter((t): t is string => t !== undefined),
      takeUntilDestroyed(),
    ),
    { initialValue: '' },
  );

  constructor() {
    effect((onCleanup) => {
      const maxPx = this.config().sidenavMobileMaxPx ?? DEFAULT_MOBILE_MAX_PX;
      const overlayBp = `(max-width: ${maxPx}.98px)`;
      const useIconRail = maxPx <= DEFAULT_MOBILE_MAX_PX;
      const queries = useIconRail ? [overlayBp, ICON_RAIL_BP] : [overlayBp];
      const sub = this.breakpointObserver.observe(queries).subscribe((state) => {
        const mobile = !!state.breakpoints[overlayBp];
        const iconRail = useIconRail ? !!state.breakpoints[ICON_RAIL_BP] : false;
        const mobileChanged = mobile !== this.isMobile();
        const iconRailChanged = iconRail !== this.isIconRail();
        this.isMobile.set(mobile);
        this.isIconRail.set(iconRail);
        if (!this._isMobileInitialized || mobileChanged || iconRailChanged) {
          this._isMobileInitialized = true;
          this.sidenavOpen.set(!mobile && !iconRail);
        }
      });
      onCleanup(() => sub.unsubscribe());
    });

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.isMobile() || this.isIconRail()) {
          this.sidenavOpen.set(false);
        }
      });

    this.theme.apply();
  }

  protected toggleSidenav(): void {
    this.sidenavOpen.update((v) => !v);
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }

  protected navigateToNewPost(): void {
    this.router.navigate(['/posts/new']);
  }
}
