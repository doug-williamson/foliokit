import { InjectionToken } from '@angular/core';
import type { ThemePack } from './theme-pack.model';

/**
 * Multi-provider token for registering additional ThemePack instances.
 * Use provideThemePacks(...packs) to add packs at bootstrap.
 * The editorial pack is always available as the service baseline — it does not
 * need to be registered via this token.
 *
 * NOTE: Intentionally has NO factory. Inject with { optional: true } and default
 * to [] in the consumer. Adding a factory here would conflict with multi: true
 * external providers (Angular does not allow mixing non-multi and multi providers).
 */
export const FOLIOKIT_THEME_PACKS = new InjectionToken<ReadonlyArray<ThemePack>>(
  'FOLIOKIT_THEME_PACKS',
);
