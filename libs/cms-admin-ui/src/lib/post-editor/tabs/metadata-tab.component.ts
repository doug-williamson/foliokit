import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, ValidationErrors } from '@angular/forms';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  RhombusChipDirective,
  RhombusDatePickerComponent,
  RhombusIconComponent,
  RhombusInputComponent,
  RhombusSelectComponent,
  RhombusTextareaComponent,
  type SelectOption,
} from '@rhombuskit/core';
import { take } from 'rxjs/operators';
import {
  Author,
  AuthorService,
  Series,
  SeriesService,
  SiteConfigService,
} from '@foliokit/cms-core';
import { PostEditorStore } from '../post-editor.store';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

/**
 * Valid when empty (the slug is auto-generated from the title) or when it
 * contains only lowercase letters, numbers, and hyphens.
 */
function slugValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  return /^[a-z0-9-]+$/.test(value) ? null : { slug: true };
}

@Component({
  selector: 'folio-metadata-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    RhombusChipDirective,
    RhombusDatePickerComponent,
    RhombusIconComponent,
    RhombusInputComponent,
    RhombusSelectComponent,
    RhombusTextareaComponent,
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
        <!-- Excerpt -->
        <rhombus-textarea
          label="Excerpt"
          placeholder="Short description shown in post cards"
          [rows]="3"
          [control]="excerptControl"
        />

        <!-- Subtitle -->
        <rhombus-input
          label="Subtitle"
          placeholder="Optional subtitle displayed below the title"
          [control]="subtitleControl"
        />

        <!-- Tags (Material chip-grid) -->
        <mat-form-field class="w-full">
          <mat-label>Tags</mat-label>
          <mat-chip-grid #chipGrid>
            @for (tag of post.tags; track tag) {
              <mat-chip-row rhombusChip (removed)="removeTag(tag, post.tags)">
                {{ tag }}
                <button matChipRemove aria-label="Remove tag">
                  <rhombus-icon name="cancel" />
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
        <rhombus-select
          label="Author"
          [options]="authorOptions()"
          [control]="authorControl"
        />

        <!-- Series -->
        <rhombus-select
          label="Series"
          [options]="seriesOptions()"
          [control]="seriesControl"
        />

        <!-- Series Order — only when a series is selected -->
        @if (post.seriesId) {
          <rhombus-input
            label="Series order"
            type="number"
            hint="Position within the series (1 = first)"
            [control]="seriesOrderControl"
          />
        }

        <!-- Published At — only when status is published -->
        @if (post.status === 'published') {
          <rhombus-date-picker label="Published At" [control]="publishedAtControl" />
        }
        @if (post.status === 'scheduled') {
          <rhombus-date-picker label="Scheduled Date" [control]="scheduledDateControl" />
          <mat-form-field class="w-full">
            <mat-label>Scheduled Time</mat-label>
            <input
              matInput
              type="time"
              [value]="scheduledTime()"
              (change)="onScheduledTimeChange($any($event.target).value)"
            />
            <mat-hint>Uses your local timezone</mat-hint>
          </mat-form-field>
        }

        <!-- Slug -->
        <rhombus-input
          label="Slug"
          placeholder="auto-generated-from-title"
          hint="Auto-generated from title; edit to override."
          [control]="slugControl"
        >
          <span rhombusError
            >Slug may only contain lowercase letters, numbers, and
            hyphens.</span
          >
        </rhombus-input>

        <!-- Internal Notes — local state only, not persisted -->
        <rhombus-textarea
          label="Internal Notes"
          placeholder="Private notes — not saved to the post"
          hint="Not persisted"
          [rows]="4"
          [control]="internalNotesControl"
        />
      </div>
    }
  `,
})
export class MetadataTabComponent {
  readonly store = inject(PostEditorStore);
  readonly separatorKeys = [ENTER, COMMA];
  protected readonly scheduledDate = signal<Date | null>(null);
  protected readonly scheduledTime = signal<string>('09:00');

  /** Store-backed controls (synced bidirectionally with `store.post()`). */
  protected readonly excerptControl = new FormControl('', {
    nonNullable: true,
  });
  protected readonly subtitleControl = new FormControl('', {
    nonNullable: true,
  });
  protected readonly authorControl = new FormControl('', { nonNullable: true });
  protected readonly seriesControl = new FormControl('', { nonNullable: true });
  protected readonly seriesOrderControl = new FormControl<number | null>(null);
  protected readonly slugControl = new FormControl('', {
    nonNullable: true,
    validators: [slugValidator],
  });
  /** ISO `YYYY-MM-DD` bound to <rhombus-date-picker>; synced from the store. */
  protected readonly publishedAtControl = new FormControl<string | null>(null);
  protected readonly scheduledDateControl = new FormControl<string | null>(null);
  /** Local-only scratch notes; never written to the store. */
  protected readonly internalNotesControl = new FormControl('', {
    nonNullable: true,
  });

  readonly authors = toSignal(inject(AuthorService).getAll(), {
    initialValue: [] as Author[],
  });

  readonly series = toSignal(inject(SeriesService).getAll(), {
    initialValue: [] as Series[],
  });

  protected readonly authorOptions = computed<SelectOption[]>(() =>
    this.authors().map((a) => ({ value: a.id, label: a.displayName })),
  );

  protected readonly seriesOptions = computed<SelectOption[]>(() => [
    { value: '', label: '(none)' },
    ...this.series().map((s) => ({ value: s.id, label: s.name })),
  ]);

  private readonly siteConfig = toSignal(
    inject(SiteConfigService).getDefaultSiteConfig().pipe(take(1)),
    { initialValue: null },
  );

  constructor() {
    // Store → controls. Value-diff guard both propagates mid-edit store writes
    // (auto-slug / auto-author) to the controls and breaks the feedback loop:
    // a control whose value already matches the store is left untouched, so the
    // setValue below never re-triggers the valueChanges → store path.
    effect(() => {
      const post = this.store.post();
      if (!post) return;
      this.syncControl(this.excerptControl, post.excerpt ?? '');
      this.syncControl(this.subtitleControl, post.subtitle ?? '');
      this.syncControl(this.authorControl, post.authorId ?? '');
      this.syncControl(this.seriesControl, post.seriesId ?? '');
      this.syncControl(this.seriesOrderControl, post.seriesOrder ?? null);
      this.syncControl(this.slugControl, post.slug);
      this.syncControl(this.publishedAtControl, this.msToIso(post.publishedAt));
    });

    // Controls → store.
    this.excerptControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => this.store.updateField('excerpt', v));
    this.subtitleControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => this.store.updateField('subtitle', v));
    this.authorControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => this.store.updateField('authorId', v));
    this.seriesControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => this.onSeriesChange(v));
    this.seriesOrderControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) =>
        this.store.updateField(
          'seriesOrder',
          typeof v === 'number' && v > 0 ? v : undefined,
        ),
      );
    this.slugControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((v) => this.store.updateField('slug', v));
    this.publishedAtControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((iso) => {
        const d = this.isoToLocalDate(iso);
        if (d) this.store.updateField('publishedAt', d.getTime());
      });
    this.scheduledDateControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((iso) => {
        const d = this.isoToLocalDate(iso);
        if (d) this.onScheduledDateChange(d);
      });

    // Auto-set authorId from site default on new posts
    effect(() => {
      const post = this.store.post();
      const config = this.siteConfig();
      if (
        this.store.mode() !== 'new' ||
        !post ||
        post.authorId ||
        !config?.defaultAuthorId
      )
        return;
      this.store.updateField('authorId', config.defaultAuthorId);
    });

    // Auto-generate slug from title on new posts (only when slug is empty)
    effect(() => {
      const post = this.store.post();
      if (
        !post ||
        post.slug !== '' ||
        this.store.mode() !== 'new' ||
        !post.title
      )
        return;
      this.store.updateField('slug', slugify(post.title));
    });

    effect(() => {
      const post = this.store.post();
      if (!post || post.status !== 'scheduled' || !post.scheduledPublishAt)
        return;
      const d = new Date(post.scheduledPublishAt);
      this.scheduledDate.set(d);
      this.syncControl(this.scheduledDateControl, this.msToIso(post.scheduledPublishAt));
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      this.scheduledTime.set(`${hh}:${mm}`);
    });
  }

  /** Patch a control from the store without re-emitting to the store. */
  private syncControl<T>(control: FormControl<T>, want: T): void {
    if (control.value !== want) control.setValue(want, { emitEvent: false });
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

  /** epoch ms → `YYYY-MM-DD` in LOCAL time (matches the picker's date-only, local semantics). */
  private msToIso(ms: number | null | undefined): string | null {
    if (!ms) return null;
    const d = new Date(ms);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** `YYYY-MM-DD` → a local Date at midnight (avoids the UTC day-shift of `new Date(iso)`). */
  private isoToLocalDate(iso: string | null): Date | null {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  onSeriesChange(seriesId: string): void {
    if (!seriesId) {
      this.store.updateField('seriesId', undefined);
      this.store.updateField('seriesOrder', undefined);
    } else {
      this.store.updateField('seriesId', seriesId);
    }
  }

  protected onScheduledDateChange(date: Date | null): void {
    if (!date) return;
    this.scheduledDate.set(date);
    this.commitScheduledPublishAt(date, this.scheduledTime());
  }

  protected onScheduledTimeChange(timeStr: string): void {
    this.scheduledTime.set(timeStr);
    const date = this.scheduledDate();
    if (!date || !timeStr) return;
    this.commitScheduledPublishAt(date, timeStr);
  }

  private commitScheduledPublishAt(date: Date, timeStr: string): void {
    const [hh, mm] = timeStr.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hh ?? 0, mm ?? 0, 0, 0);
    this.store.updateField('scheduledPublishAt', combined.getTime());
  }
}
