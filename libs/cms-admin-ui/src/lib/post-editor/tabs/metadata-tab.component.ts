import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { take } from 'rxjs/operators';
import { Author, AuthorService, BlogPost, SiteConfigService } from '@foliokit/cms-core';
import { PostEditorStore } from '../post-editor.store';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

@Component({
  selector: 'folio-metadata-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatTimepickerModule,
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
                  <mat-icon svgIcon="cancel" />
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

        <!-- Author -->
        <mat-form-field class="w-full">
          <mat-label>Author</mat-label>
          <mat-select
            [value]="post.authorId ?? ''"
            (valueChange)="store.updateField('authorId', $event)"
          >
            @for (author of authors(); track author.id) {
              <mat-option [value]="author.id">{{ author.displayName }}</mat-option>
            }
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
          <div class="flex gap-3">
            <mat-form-field class="flex-1">
              <mat-label>Publish Date</mat-label>
              <input
                matInput
                [matDatepicker]="scheduledDatePicker"
                [value]="scheduledDateValue()"
                (dateChange)="onScheduledDateChange($event.value)"
              />
              <mat-datepicker-toggle matIconSuffix [for]="scheduledDatePicker" />
              <mat-datepicker #scheduledDatePicker />
            </mat-form-field>

            <mat-form-field class="flex-1">
              <mat-label>Publish Time</mat-label>
              <input
                matInput
                [matTimepicker]="scheduledTimePicker"
                [value]="scheduledDateValue()"
                (valueChange)="onScheduledTimeChange($event)"
              />
              <mat-timepicker-toggle matIconSuffix [for]="scheduledTimePicker" />
              <mat-timepicker #scheduledTimePicker [interval]="'15 min'" />
              @if (scheduleDateError()) {
                <mat-error>{{ scheduleDateError() }}</mat-error>
              }
              <mat-hint>Publishes within 5 min of scheduled time.</mat-hint>
            </mat-form-field>
          </div>
        }

        <!-- Slug -->
        <mat-form-field class="w-full">
          <mat-label>Slug</mat-label>
          <input
            matInput
            [value]="post.slug"
            (input)="store.updateField('slug', $any($event.target).value)"
            placeholder="auto-generated-from-title"
          />
          @if (post.slug && !isValidSlug(post.slug)) {
            <mat-error>Slug may only contain lowercase letters, numbers, and hyphens.</mat-error>
          }
          <mat-hint>Auto-generated from title; edit to override.</mat-hint>
        </mat-form-field>

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
  readonly scheduleDateError = signal<string | null>(null);

  readonly authors = toSignal(inject(AuthorService).getAll(), {
    initialValue: [] as Author[],
  });

  private readonly siteConfig = toSignal(
    inject(SiteConfigService).getDefaultSiteConfig().pipe(take(1)),
    { initialValue: null },
  );

  constructor() {
    // Auto-set authorId from site default on new posts
    effect(() => {
      const post = this.store.post();
      const config = this.siteConfig();
      if (this.store.mode() !== 'new' || !post || post.authorId || !config?.defaultAuthorId) return;
      this.store.updateField('authorId', config.defaultAuthorId);
    });

    // Auto-generate slug from title on new posts (only when slug is empty)
    effect(() => {
      const post = this.store.post();
      if (!post || post.slug !== '' || this.store.mode() !== 'new' || !post.title) return;
      this.store.updateField('slug', slugify(post.title));
    });
  }

  isValidSlug(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug);
  }

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

  readonly scheduledDateValue = computed<Date | null>(() => {
    const ms = this.store.post()?.scheduledPublishAt;
    return ms ? new Date(ms) : null;
  });

  toDate(ms: number | null | undefined): Date | null {
    return ms ? new Date(ms) : null;
  }

  onPublishedAtChange(date: Date | null, post: BlogPost): void {
    if (!date) return;
    this.store.updateField('publishedAt', date.getTime());
  }

  onScheduledDateChange(date: Date | null): void {
    if (!date) return;
    const existing = this.scheduledDateValue() ?? new Date();
    const combined = new Date(date);
    combined.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
    this._applyScheduledAt(combined);
  }

  onScheduledTimeChange(date: Date | null): void {
    if (!date) return;
    const existingDate = this.scheduledDateValue() ?? new Date();
    const combined = new Date(existingDate);
    combined.setHours(date.getHours(), date.getMinutes(), 0, 0);
    this._applyScheduledAt(combined);
  }

  private _applyScheduledAt(date: Date): void {
    const ms = date.getTime();
    if (ms <= Date.now()) {
      this.scheduleDateError.set('Scheduled time must be in the future.');
      return;
    }
    this.scheduleDateError.set(null);
    this.store.updateField('scheduledPublishAt', ms);
  }
}
