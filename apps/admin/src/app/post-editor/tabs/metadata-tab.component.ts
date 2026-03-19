import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Timestamp } from 'firebase/firestore';
import { PostEditorStore } from '@foliokit/cms-admin-ui';
import { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'folio-metadata-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  styles: [
    `
      :host {
        display: block;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }
    `,
  ],
  template: `
    @if (store.post(); as post) {
      <div class="flex flex-col gap-4 p-4">
        <!-- Tags -->
        <mat-form-field class="w-full">
          <mat-label>Tags</mat-label>
          <mat-chip-grid #chipGrid>
            @for (tag of post.tags; track tag) {
              <mat-chip-row (removed)="removeTag(tag, post.tags)">
                {{ tag }}
                <button matChipRemove aria-label="Remove tag">
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip-row>
            }
          </mat-chip-grid>
          <input
            placeholder="Type and press Enter to add…"
            [matChipInputFor]="chipGrid"
            [matChipInputSeparatorKeyCodes]="separatorKeys"
            (matChipInputTokenEnd)="addTag($event, post.tags)"
          />
        </mat-form-field>

        <!-- Status -->
        <mat-form-field class="w-full">
          <mat-label>Status</mat-label>
          <mat-select
            [value]="post.status"
            (valueChange)="store.updateField('status', $event)"
          >
            <mat-option value="draft">Draft</mat-option>
            <mat-option value="scheduled">Scheduled</mat-option>
            <mat-option value="published">Published</mat-option>
            <mat-option value="archived">Archived</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Published At — only when status is published -->
        @if (post.status === 'published') {
          <mat-form-field class="w-full">
            <mat-label>Published At</mat-label>
            <input
              matInput
              [matDatepicker]="publishedPicker"
              [value]="toDate(post.publishedAt)"
              (dateChange)="onPublishedAtChange($event.value, post)"
            />
            <mat-datepicker-toggle matIconSuffix [for]="publishedPicker" />
            <mat-datepicker #publishedPicker />
          </mat-form-field>
        }

        <!-- Scheduled Publish At — only when status is scheduled -->
        @if (post.status === 'scheduled') {
          <mat-form-field class="w-full">
            <mat-label>Scheduled Publish At</mat-label>
            <input
              matInput
              [matDatepicker]="scheduledPicker"
              [value]="toDate(post.scheduledPublishAt)"
              (dateChange)="onScheduledAtChange($event.value, post)"
            />
            <mat-datepicker-toggle matIconSuffix [for]="scheduledPicker" />
            <mat-datepicker #scheduledPicker />
          </mat-form-field>
        }

        <!-- Internal Notes — local state only, not persisted -->
        <mat-form-field class="w-full">
          <mat-label>Internal Notes</mat-label>
          <textarea
            matInput
            rows="4"
            [value]="internalNotes()"
            (input)="internalNotes.set($any($event.target).value)"
            placeholder="Private notes — not saved to the post"
          ></textarea>
          <mat-hint>Not persisted</mat-hint>
        </mat-form-field>
      </div>
    }
  `,
})
export class MetadataTabComponent {
  readonly store = inject(PostEditorStore);
  readonly separatorKeys = [ENTER, COMMA];
  readonly internalNotes = signal('');

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

  toDate(ts: Timestamp | null | undefined): Date | null {
    return ts ? ts.toDate() : null;
  }

  onPublishedAtChange(date: Date | null, post: BlogPost): void {
    if (!date) return;
    this.store.updateField('publishedAt', Timestamp.fromDate(date));
  }

  onScheduledAtChange(date: Date | null, post: BlogPost): void {
    if (!date) return;
    this.store.updateField('scheduledPublishAt', Timestamp.fromDate(date));
  }
}
