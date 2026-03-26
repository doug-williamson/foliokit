import {
  ChangeDetectionStrategy,
  Component,
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { take } from 'rxjs/operators';
import { PostEditorStore } from '@foliokit/cms-admin-ui';
import { Author, AuthorService, BlogPost, SiteConfigService } from '@foliokit/cms-core';

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

  toDate(ms: number | null | undefined): Date | null {
    return ms ? new Date(ms) : null;
  }

  onPublishedAtChange(date: Date | null, post: BlogPost): void {
    if (!date) return;
    this.store.updateField('publishedAt', date.getTime());
  }

  onScheduledAtChange(date: Date | null, post: BlogPost): void {
    if (!date) return;
    this.store.updateField('scheduledPublishAt', date.getTime());
  }
}
