import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  computed,
  inject,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  RhombusAppShellComponent,
  RhombusShellNavFooterDirective,
  RhombusThemeMenuComponent,
} from '@rhombuskit/core';
import { SHELL_CONFIG } from '../shell-config.token';
import { ShellNavFooterDirective } from './shell-nav-footer.directive';

/** Overlay-drawer breakpoint used when the host config omits `sidenavMobileMaxPx`. */
const DEFAULT_MOBILE_MAX_PX = 767;

/**
 * Application shell layout.
 *
 * Wraps RhombusKit's `rhombus-app-shell` (responsive drawer + header) and keeps
 * FolioKit's config-driven contract: a brand block, theme control, and the
 * `[shellNav]` / `[shellNavFooter]` / `[shellHeaderActions]` / `[shellAuthSlot]`
 * content-projection slots that consumer apps already rely on. Consumer content
 * is re-projected into the matching rhombus slots.
 *
 * The responsive drawer (overlay below `sidenavMobileMaxPx`, docked above) and
 * the drawer toggle are owned by `rhombus-app-shell`; the previous bespoke
 * `BreakpointObserver`/icon-rail logic has been removed.
 */
@Component({
  selector: 'folio-app-shell',
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RhombusAppShellComponent,
    RhombusShellNavFooterDirective,
    NgTemplateOutlet,
    RouterLink,
    RhombusThemeMenuComponent,
  ],
})
export class AppShellComponent {
  protected readonly config = inject(SHELL_CONFIG);

  @ContentChild(ShellNavFooterDirective)
  protected navFooter?: ShellNavFooterDirective;

  /** Overlay-drawer breakpoint forwarded to `rhombus-app-shell`. */
  protected readonly sidenavMobileMaxPx = computed(
    () => this.config().sidenavMobileMaxPx ?? DEFAULT_MOBILE_MAX_PX,
  );

  private readonly router = inject(Router);

  protected navigateToNewPost(): void {
    this.router.navigate(['/posts/new']);
  }
}
