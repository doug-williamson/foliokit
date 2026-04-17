import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PostEditorStore } from '../post-editor.store';

@Component({
  selector: 'folio-content-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  styles: [
    `
      /*
       * The host must stretch to fill the flex column inside
       * .mat-mdc-tab-body-content so the textarea can grow into the
       * remaining space via flex: 1. overflow: hidden prevents the host
       * from creating its own scroll context and interfering with the
       * textarea's flex sizing.
       */
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
      .markdown-textarea {
        font-family: var(--font-body);
        font-size: 0.875rem;
        line-height: 1.5;
        resize: none;
        flex: 1;
        min-height: 0;
        width: 100%;
        padding: 0.5rem;
        outline: none;
        background: transparent;
        color: inherit;
        border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
        border-radius: 4px;
      }
      .markdown-textarea:focus {
        border-color: var(--mat-sys-primary);
        outline: none;
      }
    `,
  ],
  template: `
    @if (store.post(); as post) {
      <div class="flex flex-col flex-1 min-h-0 p-4 gap-4">
        <!-- Markdown editor — fills remaining height -->
        <div class="flex flex-col flex-1 min-h-0 gap-1">
          <label for="content-editor" class="text-xs font-medium opacity-60">
            Content (Markdown)
          </label>
          <textarea
            id="content-editor"
            class="markdown-textarea"
            [value]="post.content"
            (input)="store.updateField('content', $any($event.target).value)"
            (click)="store.setCursorPosition($any($event.target).selectionStart)"
            (keyup)="store.setCursorPosition($any($event.target).selectionStart)"
            placeholder="Write your post content in Markdown…"
          ></textarea>
        </div>
      </div>
    }
  `,
})
export class ContentTabComponent {
  readonly store = inject(PostEditorStore);
}
