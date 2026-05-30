import { isPlatformBrowser } from '@angular/common';
import {
  EnvironmentProviders,
  inject,
  makeEnvironmentProviders,
  PLATFORM_ID,
  provideEnvironmentInitializer,
} from '@angular/core';
import { provideRhombusTheme } from '@rhombuskit/theme-engine';

// Side-effect import: registers the 'light'/'dark' ThemeRegistry augmentation.
import './theme-registry';

/** RhombusThemeService's namespaced localStorage key. */
const RHOMBUS_STORAGE_KEY = 'rhombuskit:theme-preference';
/** Legacy hand-rolled ThemeService key. Held 'light' | 'dark' verbatim, never 'system'. */
const LEGACY_STORAGE_KEY = 'folio-theme';

/**
 * One-time migration shim. If the user has a legacy 'folio-theme' preference but
 * no RhombusKit preference yet, carry it across so the swap is invisible. The
 * legacy value was always 'light' or 'dark', so it is copied verbatim; anything
 * else is ignored and RhombusKit falls back to its 'system' default.
 *
 * Browser-guarded — a no-op during SSR.
 */
function migrateLegacyThemePreference(): void {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

  try {
    if (localStorage.getItem(RHOMBUS_STORAGE_KEY) !== null) return;

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy === 'light' || legacy === 'dark') {
      localStorage.setItem(RHOMBUS_STORAGE_KEY, legacy);
    }
  } catch {
    // localStorage may be unavailable (private browsing, etc.) — skip migration.
  }
}

/**
 * FolioKit's theme wrapper around RhombusThemeService. Preserves FolioKit's
 * public data-theme="light"|"dark" contract and follows the OS preference on
 * first load.
 *
 * The migration initializer is registered FIRST so it runs before
 * RhombusThemeService first reads storage.
 */
export function provideFolioKitTheme(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(migrateLegacyThemePreference),
    provideRhombusTheme({ light: 'light', dark: 'dark', default: 'system' }),
  ]);
}
