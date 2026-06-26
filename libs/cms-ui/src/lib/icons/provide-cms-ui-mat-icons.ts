import { EnvironmentProviders } from '@angular/core';
import { provideRhombusIcons } from '@rhombuskit/core';
import { CMS_UI_ICON_SVG_MAP } from './cms-ui-icon-svg-map';

/**
 * Registers @foliokit/cms-ui's icon set (app shell, about/links pages, not-found)
 * with RhombusKit's `RhombusIconRegistry`, so `<rhombus-icon name="…">` renders each
 * entry as an inline `currentColor` SVG (no Material Icons font). `CMS_UI_ICON_SVG_MAP`
 * is a `name → SVG-literal` map — the exact shape `provideRhombusIcons` consumes.
 *
 * Host apps that use cms-ui without cms-admin-ui must include this provider.
 *
 * (The former `provideCmsUiMatIcons()` MatIconRegistry variant was removed once the
 * `<mat-icon svgIcon>` → `<rhombus-icon>` migration completed — no `<mat-icon svgIcon>`
 * usage remains in cms-ui.)
 */
export function provideCmsUiRhombusIcons(): EnvironmentProviders {
  return provideRhombusIcons(CMS_UI_ICON_SVG_MAP);
}
