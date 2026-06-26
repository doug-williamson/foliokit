import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideRhombusTheme, provideRhombusThemes } from '@rhombuskit/theme-engine';

// Side-effect import: registers the 'light'/'dark'/'slate-*'/'sandstone-*' ThemeRegistry augmentation.
import './theme-registry';
import { FOLIOKIT_REGISTERED_THEMES } from './registered-themes';

/**
 * FolioKit's theme wrapper around RhombusThemeService. Preserves FolioKit's
 * public data-theme="light"|"dark" contract and follows the OS preference on
 * first load.
 *
 * The legacy `folio-theme` → `rhombuskit:theme-preference` migration runs in the
 * pre-paint init script (FOLIOKIT_THEME_INIT_SCRIPT, inlined in each app's
 * index.html), ahead of both first paint and bootstrap — so migrating users
 * never flash and no runtime migration initializer is needed here.
 *
 * TRACKED FUTURE WORK (CSP): both FOUC prevention AND the one-time legacy
 * migration depend on the inline init script executing. Under a strict
 * Content-Security-Policy that blocks inline scripts, neither happens until the
 * user manually toggles. The correct fix is nonce-injecting the init script via
 * a server-side HTML transform (out of scope; no such hook exists today) — NOT
 * reintroducing a bootstrap migration initializer, which would only salvage
 * migration, post-paint, and would need removing once nonce injection lands.
 */
export function provideFolioKitTheme(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideRhombusTheme({ light: 'light', dark: 'dark', default: 'system' }),
    // Register FolioKit's palettes (Editorial / Slate / Sandstone × light+dark) so
    // RhombusThemeService exposes palettes()/setPalette()/setMode() and the registry-aware
    // pre-paint init script honours a stored palette theme. Colours for each registered
    // theme live in CSS under [data-theme="<name>"] (libs/cms-ui/src/styles).
    provideRhombusThemes(...FOLIOKIT_REGISTERED_THEMES),
  ]);
}
