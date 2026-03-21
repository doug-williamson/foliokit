import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageEditorStore } from './page-editor.store';
import { PageEditorHeroImageComponent } from './page-editor-hero-image.component';

@Component({
  selector: 'admin-about-editor-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    PageEditorHeroImageComponent,
  ],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }
      .markdown-textarea {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        resize: none;
        flex: 1;
        min-height: 200px;
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
    @if (store.page(); as page) {
      @if (page.type === 'about') {
        <div class="flex flex-col gap-4 p-4">
          <mat-form-field class="w-full shrink-0">
            <mat-label>Title</mat-label>
            <input
              matInput
              [value]="page.title"
              (input)="store.updateField('title', $any($event.target).value)"
              placeholder="About"
            />
          </mat-form-field>

          <admin-page-editor-hero-image class="shrink-0" />

          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium opacity-60">Body (Markdown)</label>
            <textarea
              class="markdown-textarea"
              [value]="page.body"
              (input)="store.updateField('body', $any($event.target).value)"
              (click)="store.setCursorPosition($any($event.target).selectionStart)"
              (keyup)="store.setCursorPosition($any($event.target).selectionStart)"
              placeholder="Write your about page content in Markdown…"
            ></textarea>
          </div>
        </div>
      }
    }
  `,
})
export class AboutEditorFormComponent {
  readonly store = inject(PageEditorStore);
}
