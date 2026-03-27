import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Site configuration editor with General, Navigation (drag-drop), and SEO tabs.
 *
 * **Phase 2 component** — currently a placeholder stub. The complete
 * implementation will be promoted from the reference admin app in Phase 2.
 */
@Component({
  selector: 'folio-site-config-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 2rem; text-align: center; opacity: 0.5;">
      Site config — Phase 2
    </div>
  `,
})
export class SiteConfigPageComponent {
  /** Satisfies HasDirtyStore for unsavedChangesGuard. */
  readonly store = { isDirty: () => false };
}
