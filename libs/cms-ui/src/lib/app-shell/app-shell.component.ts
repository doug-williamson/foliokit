import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { NavigationEnd, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SHELL_CONFIG } from '../shell-config.token';
import { ThemeService } from '../theme.service';
import { ShellNavFooterDirective } from './shell-nav-footer.directive';

const MOBILE_BP = '(max-width: 767.98px)';
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
  ],
})
export class AppShellComponent implements OnInit, OnDestroy {
  protected readonly config = inject(SHELL_CONFIG);
  protected readonly theme = inject(ThemeService);

  @ContentChild(ShellNavFooterDirective) protected navFooter?: ShellNavFooterDirective;

  protected readonly isMobile = signal(false);
  protected readonly isIconRail = signal(false);
  protected readonly sidenavOpen = signal(false);

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private bpSub?: Subscription;
  private navSub?: Subscription;

  ngOnInit(): void {
    this.bpSub = this.breakpointObserver
      .observe([MOBILE_BP, ICON_RAIL_BP])
      .subscribe((state) => {
        const mobile = state.breakpoints[MOBILE_BP];
        const iconRail = state.breakpoints[ICON_RAIL_BP];
        this.isMobile.set(mobile);
        this.isIconRail.set(iconRail);
        // Desktop: side mode, always open. Mobile/tablet: overlay, closed.
        this.sidenavOpen.set(!mobile && !iconRail);
      });

    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile() || this.isIconRail()) {
          this.sidenavOpen.set(false);
        }
      });

    this.theme.apply();
  }

  ngOnDestroy(): void {
    this.bpSub?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  protected toggleSidenav(): void {
    this.sidenavOpen.update((v) => !v);
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }
}
