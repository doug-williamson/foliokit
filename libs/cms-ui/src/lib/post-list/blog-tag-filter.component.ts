import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import type { Tag } from '@foliokit/cms-core';

@Component({
  selector: 'folio-tag-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <div class="flex flex-wrap gap-2">
      <button
        class="tag-chip"
        [class.tag-chip--active]="activeTag() === null"
        (click)="select(null)"
      >
        All
      </button>
      @for (tag of visibleTags(); track tag.id) {
        <button
          class="tag-chip"
          [class.tag-chip--active]="activeTag() === tag.id"
          (click)="select(tag.id)"
        >
          {{ tag.label }}
        </button>
      }
      @if (tags().length > 8) {
        <button
          class="tag-chip tag-chip--control"
          [attr.aria-expanded]="showAllTags()"
          (click)="showAllTags.set(!showAllTags())"
        >
          {{ showAllTags() ? 'Show less' : 'Show all (' + tags().length + ')' }}
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .tag-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.3125rem 0.875rem;
      border-radius: 100px;
      border: 1px solid var(--border);
      background: var(--surface-1);
      color: var(--text-secondary);
      font-size: 0.7rem;
      font-family: var(--font-mono);
      font-weight: 500;
      text-transform: uppercase;
      cursor: pointer;
      transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
      line-height: 1;

      &:hover {
        background: var(--surface-2);
        color: var(--text-primary);
        border-color: var(--border-accent);
      }

      &.tag-chip--active {
        background-color: var(--teal-50);
        border-color: var(--border-accent);
        color: var(--text-accent);

        &:hover {
          background-color: var(--teal-50);
          border-color: var(--border-accent);
          color: var(--text-accent);
        }
      }

      &.tag-chip--control {
        color: var(--text-muted);
        background: var(--surface-2);
        border-color: var(--border);

        &:hover {
          color: var(--text-primary);
          background: var(--surface-2);
          border-color: var(--border-accent);
        }
      }
    }

    :host-context([data-theme="dark"]) .tag-chip.tag-chip--active,
    :host-context([data-theme="dark"]) .tag-chip.tag-chip--active:hover {
      background-color: rgba(42, 151, 151, 0.12);
    }
  `],
})
export class BlogTagFilterComponent {
  readonly tags = input.required<Tag[]>();
  readonly postCounts = input<Map<string, number>>(new Map());
  readonly tagSelected = output<string | null>();

  protected readonly activeTag = signal<string | null>(null);
  protected readonly showAllTags = signal(false);

  protected readonly sortedTags = computed(() =>
    [...this.tags()].sort((a, b) => {
      const diff = (this.postCounts().get(b.id) ?? 0) - (this.postCounts().get(a.id) ?? 0);
      return diff !== 0 ? diff : a.label.localeCompare(b.label);
    }),
  );

  protected readonly visibleTags = computed(() =>
    this.showAllTags() ? this.sortedTags() : this.sortedTags().slice(0, 8),
  );

  protected select(tag: string | null): void {
    this.activeTag.set(tag);
    this.tagSelected.emit(tag);
  }

  setActive(tag: string | null): void {
    this.activeTag.set(tag);
  }
}
