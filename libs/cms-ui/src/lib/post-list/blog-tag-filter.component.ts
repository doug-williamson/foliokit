import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import {
  RhombusButtonComponent,
  RhombusChipDirective,
  RhombusChipGroupDirective,
} from '@rhombuskit/core';
import type { Tag } from '@foliokit/cms-core';

@Component({
  selector: 'folio-tag-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatChipsModule,
    RhombusChipDirective,
    RhombusChipGroupDirective,
    RhombusButtonComponent,
  ],
  template: `
    <div class="tag-filter-row">
      <mat-chip-listbox
        rhombusChipGroup
        selection="single"
        hideSingleSelectionIndicator
        aria-label="Filter posts by tag"
        [value]="selectedValue()"
        (change)="onChange($event.value)"
      >
        <mat-chip-option rhombusChip variant="primary" [value]="ALL"
          >All</mat-chip-option
        >
        @for (tag of visibleTags(); track tag.id) {
          <mat-chip-option rhombusChip variant="primary" [value]="tag.id">
            {{ tag.label }}
          </mat-chip-option>
        }
      </mat-chip-listbox>

      @if (tags().length > 8) {
        <rhombus-button
          appearance="text"
          variant="secondary"
          size="sm"
          [attr.aria-expanded]="showAllTags()"
          (click)="showAllTags.set(!showAllTags())"
        >
          {{ showAllTags() ? 'Show less' : 'Show all (' + tags().length + ')' }}
        </rhombus-button>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .tag-filter-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
    `,
  ],
})
export class BlogTagFilterComponent {
  readonly tags = input.required<Tag[]>();
  readonly postCounts = input<Map<string, number>>(new Map());
  readonly tagSelected = output<string | null>();

  /** Sentinel for the "All" chip — Material single-select needs a non-null value to track. */
  protected readonly ALL = '__all__';

  protected readonly activeTag = signal<string | null>(null);
  protected readonly showAllTags = signal(false);

  /** Listbox value mirrors {@link activeTag}, mapping `null` (All) onto the sentinel. */
  protected readonly selectedValue = computed(
    () => this.activeTag() ?? this.ALL,
  );

  protected readonly sortedTags = computed(() =>
    [...this.tags()].sort((a, b) => {
      const diff =
        (this.postCounts().get(b.id) ?? 0) - (this.postCounts().get(a.id) ?? 0);
      return diff !== 0 ? diff : a.label.localeCompare(b.label);
    }),
  );

  protected readonly visibleTags = computed(() =>
    this.showAllTags() ? this.sortedTags() : this.sortedTags().slice(0, 8),
  );

  /** Map the listbox change (sentinel or a deselect → `null`) onto the public contract. */
  protected onChange(value: string | null | undefined): void {
    this.select(value && value !== this.ALL ? value : null);
  }

  protected select(tag: string | null): void {
    this.activeTag.set(tag);
    this.tagSelected.emit(tag);
  }

  setActive(tag: string | null): void {
    this.activeTag.set(tag);
  }
}
