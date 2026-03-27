import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Links page editor — wraps `LinksEditorFormComponent` with a toolbar,
 * loading spinner, and sticky save/discard footer.
 *
 * **Phase 2 component** — currently a placeholder stub. The complete
 * implementation will be promoted from the reference admin app in Phase 2.
 */
@Component({
  selector: 'folio-links-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 2rem; text-align: center; opacity: 0.5;">
      Links page editor — Phase 2
    </div>
  `,
})
export class LinksPageEditorComponent {
  /** Satisfies HasDirtyStore for unsavedChangesGuard. */
  readonly store = { isDirty: () => false };
}
