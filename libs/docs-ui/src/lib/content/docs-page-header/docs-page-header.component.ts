import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RhombusPageHeaderComponent } from '@rhombuskit/core';
import { DOCS_PAGE_META } from '../../tokens/docs-tokens';

/**
 * Thin adapter over RhombusKit's `<rhombus-page-header>` (the composite that was
 * extracted from this very component). It keeps the `docs-page-header` selector
 * and the `DOCS_PAGE_META` injection as the data source, so existing call sites
 * are untouched, while the rendered markup is now the upstream composite.
 *
 * NOTE: the shell still renders this at parent-injector level where
 * `DOCS_PAGE_META` is null (see issue #162 / docs-page-meta injection bug); the
 * full fix — sourcing meta reactively at the shell and retiring this adapter —
 * is deferred until the docs app build is green again.
 */
@Component({
  selector: 'docs-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusPageHeaderComponent],
  template: `
    @if (pageMeta) {
      <rhombus-page-header
        [title]="pageMeta.title"
        [badge]="pageMeta.badge"
        [description]="pageMeta.description"
      />
    }
  `,
})
export class DocsPageHeaderComponent {
  readonly pageMeta = inject(DOCS_PAGE_META, { optional: true });
}
