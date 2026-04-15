import { InjectionToken, Signal, WritableSignal } from '@angular/core';
import type { PlanFeatures } from '../models/plan-features.model';

export interface ShellConfig {
  appName: string;
  logoUrl?: string;
  showAuth?: boolean;
  features?: PlanFeatures;
  /** Admin-only: shows a global "+ New post" icon button in the shell header. Defaults to false. */
  showNewPostButton?: boolean;
  /** Admin-only: displays the current route title in the shell header. Defaults to false. */
  showRouteTitle?: boolean;
  /** When set, toolbar logo and app name navigate here (e.g. `/dashboard` or `/`). */
  toolbarHomeRoute?: string;
  /**
   * Viewport width (px) at or below which the navigation drawer uses overlay mode.
   * Defaults to 767 when unset (legacy blog shell).
   */
  sidenavMobileMaxPx?: number;
  /**
   * When true with overlay drawer: use a floating action button to open the drawer when closed
   * instead of only the toolbar menu button (admin shell).
   */
  sidenavFabTrigger?: boolean;
}

export const SHELL_CONFIG = new InjectionToken<Signal<ShellConfig>>('SHELL_CONFIG');

/**
 * Convenience type alias for the writable signal expected by `SHELL_CONFIG` providers.
 *
 * ```ts
 * import { ShellConfigSignal, ShellConfig } from '@foliokit/cms-core';
 *
 * const config: ShellConfigSignal = signal<ShellConfig>({ appName: 'My App' });
 * ```
 */
export type ShellConfigSignal = WritableSignal<ShellConfig>;
