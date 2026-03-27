import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Author create/edit form with photo upload and bio fields.
 *
 * **Phase 2 component** — currently a placeholder stub. The complete
 * implementation will be promoted from the reference admin app in Phase 2.
 *
 * @input id - Route parameter; when present the form loads the existing author.
 */
@Component({
  selector: 'folio-author-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 2rem; text-align: center; opacity: 0.5;">
      Author form — Phase 2
    </div>
  `,
})
export class AuthorFormComponent {
  /** Route param: existing author ID, or absent for a new author. */
  readonly id = input<string | undefined>(undefined);
}
