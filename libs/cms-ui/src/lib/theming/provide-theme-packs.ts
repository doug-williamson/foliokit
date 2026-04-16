import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import type { ThemePack } from './theme-pack.model';
import { FOLIOKIT_THEME_PACKS } from './theme-pack.tokens';

/**
 * Registers additional ThemePack instances with the DI system.
 * Use at application bootstrap to add packs beyond the built-in editorial pack.
 *
 * The editorial pack is always available as the service baseline and does not
 * need to be registered here.
 *
 * @example
 * // In app.config.ts:
 * provideThemePacks(MY_CUSTOM_PACK, ANOTHER_PACK)
 */
export function provideThemePacks(...packs: ThemePack[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: FOLIOKIT_THEME_PACKS, useValue: packs, multi: true },
  ]);
}
