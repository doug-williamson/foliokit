import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PostEditorStore } from '@foliokit/cms-admin-ui';

@Component({
  selector: 'folio-content-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
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
        font-family: var(--font-mono);
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
        <!-- Title -->
        <mat-form-field class="w-full shrink-0">
          <mat-label>Title</mat-label>
          <input
            matInput
            [value]="post.title"
            (input)="store.updateField('title', $any($event.target).value)"
            placeholder="Post title"
          />
        </mat-form-field>

        <!-- Subtitle -->
        <mat-form-field class="w-full shrink-0">
          <mat-label>Subtitle</mat-label>
          <input
            matInput
            [value]="post.subtitle ?? ''"
            (input)="store.updateField('subtitle', $any($event.target).value)"
            placeholder="Optional subtitle"
          />
        </mat-form-field>

        <!-- Excerpt -->
        <mat-form-field class="w-full shrink-0">
          <mat-label>Excerpt</mat-label>
          <textarea
            matInput
            rows="3"
            [value]="post.excerpt ?? ''"
            (input)="store.updateField('excerpt', $any($event.target).value)"
            placeholder="Short description shown in post cards"
          ></textarea>
        </mat-form-field>

        <!-- Markdown editor — fills remaining height -->
        <div class="flex flex-col flex-1 min-h-0 gap-1">
          <label class="text-xs font-medium" style="color: var(--text-secondary)">
            Content (Markdown)
          </label>
          <textarea
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
