import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCS_PAGE_META } from '../../tokens/docs-tokens';

@Component({
  selector: 'docs-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (pageMeta) {
      <header class="docs-page-header mb-10">
        <div class="flex items-center gap-3 mb-2">
          <h1 class="docs-page-header__title">{{ pageMeta.title }}</h1>
          @if (pageMeta.badge) {
            <span class="docs-page-header__badge">{{ pageMeta.badge }}</span>
          }
        </div>
        @if (pageMeta.description) {
          <p class="mt-2 text-base text-[var(--mat-sys-on-surface-variant)] leading-relaxed max-w-2xl">
            {{ pageMeta.description }}
          </p>
        }
      </header>
    }
  `,
  styleUrl: './docs-page-header.component.scss',
})
export class DocsPageHeaderComponent {
  readonly pageMeta = inject(DOCS_PAGE_META, { optional: true });
}
