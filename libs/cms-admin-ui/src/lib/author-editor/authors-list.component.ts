import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Authors list page showing all authors with edit/delete actions.
 *
 * **Phase 2 component** — currently a placeholder stub. The complete
 * implementation will be promoted from the reference admin app in Phase 2.
 */
@Component({
  selector: 'folio-authors-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 2rem; text-align: center; opacity: 0.5;">
      Authors list — Phase 2
    </div>
  `,
})
export class AuthorsListComponent {}
