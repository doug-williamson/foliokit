import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Full post editor page with Content, Metadata, SEO, and Media tabs
 * plus a responsive side-by-side preview panel.
 *
 * **Phase 2 component** — currently a placeholder stub. The complete
 * implementation will be promoted from the reference admin app in Phase 2.
 *
 * @input id - Route parameter; when present the editor loads the existing post.
 *             When absent the editor initialises a new post draft.
 */
@Component({
  selector: 'folio-post-editor-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="padding: 2rem; text-align: center; opacity: 0.5;">
      Post editor — Phase 2
    </div>
  `,
})
export class PostEditorPageComponent {
  /** Route param: existing post ID, or absent for a new post. */
  readonly id = input<string | undefined>(undefined);
}
