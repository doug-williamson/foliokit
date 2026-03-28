import { ENVIRONMENT_INITIALIZER, inject, Provider } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
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
