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
    }

    :host-context([data-theme="dark"]) .tag-chip.tag-chip--active,
    :host-context([data-theme="dark"]) .tag-chip.tag-chip--active:hover {
      background-color: rgba(42, 151, 151, 0.12);
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
