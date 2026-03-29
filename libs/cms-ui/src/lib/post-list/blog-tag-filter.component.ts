import {
  ChangeDetectionStrategy,
  Component,
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
      @for (tag of tags(); track tag.id) {
        <button
          class="tag-chip"
          [class.tag-chip--active]="activeTag() === tag.id"
          (click)="select(tag.id)"
        >
          {{ tag.label }}
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
      border-radius: 9999px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-family: var(--font-body);
      font-weight: 500;
      cursor: pointer;
      transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
      line-height: 1;

      &:hover {
        border-color: var(--text-accent);
        color: var(--text-accent);
      }

      &.tag-chip--active {
        background-color: var(--text-accent);
        border-color: var(--text-accent);
        color: var(--btn-primary-text);

        &:hover {
          background-color: color-mix(in srgb, var(--text-accent) 80%, var(--ink-950));
          border-color: color-mix(in srgb, var(--text-accent) 80%, var(--ink-950));
          color: var(--btn-primary-text);
        }
      }
    }
  `],
})
export class BlogTagFilterComponent {
  readonly tags = input.required<Tag[]>();
  readonly tagSelected = output<string | null>();

  protected readonly activeTag = signal<string | null>(null);

  protected select(tag: string | null): void {
    this.activeTag.set(tag);
    this.tagSelected.emit(tag);
  }

  setActive(tag: string | null): void {
    this.activeTag.set(tag);
  }
}
