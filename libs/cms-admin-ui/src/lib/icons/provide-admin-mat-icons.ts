import { EnvironmentProviders } from '@angular/core';
import { provideRhombusIcons } from '@rhombuskit/core';
import { ICON_SVG_MAP } from './icon-svg-map';

/**
 * Registers the admin icon set with RhombusKit's `RhombusIconRegistry`, so
 * `<rhombus-icon name="…">` renders each entry as an inline `currentColor` SVG
 * (no Material Icons font). `ICON_SVG_MAP` is a `name → SVG-literal` map — the
 * exact shape `provideRhombusIcons` consumes. Wired into {@link provideAdminKit}.
 *
 * (The former `provideAdminMatIcons()` MatIconRegistry variant was removed once the
 * `<mat-icon svgIcon>` → `<rhombus-icon>` migration completed — no `<mat-icon svgIcon>`
 * usage remains in cms-admin-ui.)
 */
export function provideAdminRhombusIcons(): EnvironmentProviders {
  return provideRhombusIcons(ICON_SVG_MAP);
}
