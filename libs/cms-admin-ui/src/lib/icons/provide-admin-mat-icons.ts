import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  inject,
  Provider,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { provideRhombusIcons } from '@rhombuskit/core';
import { ICON_SVG_MAP } from './icon-svg-map';

/**
 * Registers all Material Icons used by cms-admin-ui (and shared cms-ui
 * components) as inlined SVG literals via `MatIconRegistry`.
 *
 * This removes the need for the global `material-icons` CSS font in host
 * apps that only use the admin UI.  Every `<mat-icon svgIcon="name" />`
 * in the library resolves to a bundled SVG — no HTTP requests required.
 */
export function provideAdminMatIcons(): Provider {
  return {
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useFactory: () => {
      const registry = inject(MatIconRegistry);
      const sanitizer = inject(DomSanitizer);

      return () => {
        for (const [name, svg] of Object.entries(ICON_SVG_MAP)) {
          registry.addSvgIconLiteral(
            name,
            sanitizer.bypassSecurityTrustHtml(svg),
          );
        }
      };
    },
  };
}

/**
 * Registers the same admin icon set with RhombusKit's `RhombusIconRegistry`, so
 * `<rhombus-icon name="…">` renders each entry as an inline `currentColor` SVG
 * (no Material Icons font). `ICON_SVG_MAP` is a `name → SVG-literal` map — the
 * exact shape `provideRhombusIcons` consumes — so it ports across unchanged.
 *
 * Wired into {@link provideAdminKit} alongside {@link provideAdminMatIcons}
 * during the `<mat-icon svgIcon>` → `<rhombus-icon>` migration; once no
 * `<mat-icon svgIcon>` remains, the `MatIconRegistry` variant is dropped.
 */
export function provideAdminRhombusIcons(): EnvironmentProviders {
  return provideRhombusIcons(ICON_SVG_MAP);
}
