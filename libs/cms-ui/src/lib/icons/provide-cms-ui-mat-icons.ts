import {
  ENVIRONMENT_INITIALIZER,
  EnvironmentProviders,
  inject,
  Provider,
} from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { provideRhombusIcons } from '@rhombuskit/core';
import { CMS_UI_ICON_SVG_MAP } from './cms-ui-icon-svg-map';

/**
 * Registers SVG icons used by `<mat-icon svgIcon="…">` in @foliokit/cms-ui
 * (app shell, about/links pages, not-found). Host apps that use cms-ui without
 * cms-admin-ui must include this provider.
 */
export function provideCmsUiMatIcons(): Provider {
  return {
    provide: ENVIRONMENT_INITIALIZER,
    multi: true,
    useFactory: () => {
      const registry = inject(MatIconRegistry);
      const sanitizer = inject(DomSanitizer);

      return () => {
        for (const [name, svg] of Object.entries(CMS_UI_ICON_SVG_MAP)) {
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
 * Registers the same `@foliokit/cms-ui` icon set with RhombusKit's
 * `RhombusIconRegistry`, so `<rhombus-icon name="…">` renders each entry as an
 * inline `currentColor` SVG (no Material Icons font). `CMS_UI_ICON_SVG_MAP` is a
 * `name → SVG-literal` map — the exact shape `provideRhombusIcons` consumes.
 *
 * Provided alongside {@link provideCmsUiMatIcons} during the `<mat-icon svgIcon>`
 * → `<rhombus-icon>` migration; once no `<mat-icon svgIcon>` remains this becomes
 * the sole icon-registration path and the `MatIconRegistry` variant is dropped.
 */
export function provideCmsUiRhombusIcons(): EnvironmentProviders {
  return provideRhombusIcons(CMS_UI_ICON_SVG_MAP);
}
