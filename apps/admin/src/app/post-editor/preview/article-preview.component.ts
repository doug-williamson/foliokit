import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MarkdownComponent } from '@foliokit/cms-markdown';
import { PostEditorStore } from '@foliokit/cms-admin-ui';

@Component({
  selector: 'folio-article-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownComponent],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }
    `,
  ],
  template: `
    <div class="max-w-prose mx-auto w-full px-6 py-8">
      @if (store.post(); as post) {
        <folio-markdown
          [content]="post.content"
          [embeddedMedia]="post.embeddedMedia"
        />
      } @else {
        <p class="opacity-40 text-sm">No content yet.</p>
      }
    </div>
  `,
})
export class ArticlePreviewComponent {
  readonly store = inject(PostEditorStore);
}
