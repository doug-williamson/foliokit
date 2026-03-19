import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SHELL_CONFIG } from '../shell-config.token';
import { ThemeService } from '../theme.service';

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

  protected readonly isMobile = signal(false);
  protected readonly sidenavOpen = signal(false);

  private readonly breakpointObserver = inject(BreakpointObserver);
  private bpSub?: Subscription;

  ngOnInit(): void {
    this.bpSub = this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .subscribe((state) => {
        const mobile = state.matches;
        this.isMobile.set(mobile);
        this.sidenavOpen.set(!mobile);
      });
    this.theme.apply();
  }

  ngOnDestroy(): void {
    this.bpSub?.unsubscribe();
  }

  protected toggleSidenav(): void {
    this.sidenavOpen.update((open) => !open);
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }
}
