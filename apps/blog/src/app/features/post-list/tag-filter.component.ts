import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-tag-filter',
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
      @for (tag of tags(); track tag) {
        <button
          class="tag-chip"
          [class.tag-chip--active]="activeTag() === tag"
          (click)="select(tag)"
        >
          {{ tag }}
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
      border-radius: var(--folio-blog-radius-chip);
      border: 1px solid var(--folio-blog-border);
      background: transparent;
      color: var(--folio-blog-text-secondary);
      font-size: 0.8125rem;
      font-family: var(--folio-blog-font-sans);
      font-weight: 500;
      cursor: pointer;
      transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease;
      line-height: 1;

      &:hover {
        border-color: var(--folio-blog-accent);
        color: var(--folio-blog-accent);
      }

      &--active {
        background-color: var(--folio-blog-accent);
        border-color: var(--folio-blog-accent);
        color: #fff;

        &:hover {
          background-color: var(--folio-blog-accent-hover);
          border-color: var(--folio-blog-accent-hover);
          color: #fff;
        }
      }
    }
  `],
})
export class TagFilterComponent {
  readonly tags = input.required<string[]>();
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
