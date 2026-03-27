import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * About page editor with photo upload (light/dark), social links form array,
 * bio (Markdown), and SEO fields.
 *
 * **Phase 2 component** — currently a placeholder stub. The complete
 * implementation will be promoted from the reference admin app in Phase 2.
 */
@Component({
  selector: 'folio-about-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 2rem; text-align: center; opacity: 0.5;">
      About page editor — Phase 2
    </div>
  `,
})
export class AboutPageEditorComponent {
  /** Satisfies HasDirtyStore for unsavedChangesGuard. */
  readonly store = { isDirty: () => false };
}
