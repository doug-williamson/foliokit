import { InjectionToken, Signal, WritableSignal } from '@angular/core';
import type { PlanFeatures } from '../models/plan-features.model';
import type { NavEntry } from '../models/site-config.model';

export interface ShellConfig {
  appName: string;
  logoUrl?: string;
  showAuth?: boolean;
  nav?: NavEntry[];
  features?: PlanFeatures;
  /** Admin-only: shows a global "+ New post" icon button in the shell header. Defaults to false. */
  showNewPostButton?: boolean;
  /** Admin-only: displays the current route title in the shell header. Defaults to false. */
  showRouteTitle?: boolean;
  /** When set, toolbar logo and app name navigate here (e.g. `/dashboard` or `/`). */
  toolbarHomeRoute?: string;
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
