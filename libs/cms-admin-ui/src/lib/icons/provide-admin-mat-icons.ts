import { ENVIRONMENT_INITIALIZER, inject, Provider } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
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
