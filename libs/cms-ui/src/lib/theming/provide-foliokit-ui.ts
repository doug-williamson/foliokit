import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideCmsUiRhombusIcons } from '../icons/provide-cms-ui-mat-icons';
import { provideFolioKitTheme } from './foliokit-theme.providers';

/**
 * Canonical FolioKit UI bootstrap for design-system-consumer apps (blog, docs).
 *
 * Bundles the two providers every cms-ui consumer needs together so an app can
 * never wire one without the other:
 *  - `provideFolioKitTheme()` — RhombusKit theme-engine + registered FolioKit
 *    palettes (Editorial / Slate / Sandstone), light/dark + system.
 *  - `provideCmsUiRhombusIcons()` — the shared cms-ui icon set (app shell,
 *    about/links pages, not-found). Without it, shared `<rhombus-icon>` renders
 *    blank — the bug docs hit by calling only `provideFolioKitTheme()`.
 *
 * The **admin** app does NOT use this: it registers its own icon set via
 * `provideAdminKit()` → `provideAdminRhombusIcons()` and calls
 * `provideFolioKitTheme()` directly to avoid icon-name collisions.
 */
export function provideFolioKitUi(): EnvironmentProviders {
  return makeEnvironmentProviders([provideFolioKitTheme(), provideCmsUiRhombusIcons()]);
}
