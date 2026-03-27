import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Pages hub: feature cards for About and Links pages with enable/disable toggles
 * and links to their respective editors.
 *
 * **Phase 2 component** — currently a placeholder stub. The complete
 * implementation will be promoted from the reference admin app in Phase 2.
 */
@Component({
  selector: 'folio-admin-pages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 2rem; text-align: center; opacity: 0.5;">
      Pages hub — Phase 2
    </div>
  `,
})
export class AdminPagesComponent {}
