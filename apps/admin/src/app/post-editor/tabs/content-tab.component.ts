import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { PostEditorStore } from '@foliokit/cms-admin-ui';

@Component({
  selector: 'folio-content-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
  ],
  template: `
    @if (store.post(); as post) {
      <div class="flex flex-col gap-4 p-4">
        <!-- Title -->
        <mat-form-field class="w-full">
          <mat-label>Title</mat-label>
          <input
            matInput
            [value]="post.title"
            (input)="store.updateField('title', $any($event.target).value)"
            placeholder="Post title"
          />
        </mat-form-field>

        <!-- Subtitle -->
        <mat-form-field class="w-full">
          <mat-label>Subtitle</mat-label>
          <input
            matInput
            [value]="post.subtitle ?? ''"
            (input)="store.updateField('subtitle', $any($event.target).value)"
            placeholder="Optional subtitle"
          />
        </mat-form-field>

        <!-- Excerpt -->
        <mat-form-field class="w-full">
          <mat-label>Excerpt</mat-label>
          <textarea
            matInput
            rows="3"
            [value]="post.excerpt ?? ''"
            (input)="store.updateField('excerpt', $any($event.target).value)"
            placeholder="Short description shown in post cards"
          ></textarea>
        </mat-form-field>

        <!-- Content (plain textarea) -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-600">Content (Markdown)</label>
          <textarea
            class="w-full font-mono text-sm border border-gray-300 rounded p-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            style="min-height: 400px"
            [value]="post.content"
            (input)="store.updateField('content', $any($event.target).value)"
            placeholder="Write your post content in Markdown…"
          ></textarea>
        </div>

        <!-- Tags -->
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium text-gray-600">Tags</label>
          <mat-chip-grid #chipGrid>
            @for (tag of post.tags; track tag) {
              <mat-chip-row (removed)="removeTag(tag, post.tags)">
                {{ tag }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
            }
          </mat-chip-grid>
          <input
            placeholder="Add tag…"
            [matChipInputFor]="chipGrid"
            [matChipInputSeparatorKeyCodes]="separatorKeys"
            (matChipInputTokenEnd)="addTag($event, post.tags)"
            class="mt-1 border-b border-gray-300 focus:outline-none focus:border-blue-500 text-sm py-1"
          />
        </div>
      </div>
    }
  `,
})
export class ContentTabComponent {
  readonly store = inject(PostEditorStore);
  readonly separatorKeys = [ENTER, COMMA];

  addTag(event: MatChipInputEvent, currentTags: string[]): void {
    const value = (event.value ?? '').trim();
    if (value && !currentTags.includes(value)) {
      this.store.updateField('tags', [...currentTags, value]);
    }
    event.chipInput.clear();
  }

  removeTag(tag: string, currentTags: string[]): void {
    this.store.updateField(
      'tags',
      currentTags.filter((t) => t !== tag),
    );
  }
}
