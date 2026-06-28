import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BlogPost } from '@foliokit/cms-core';
import { RhombusCardComponent, RhombusEmptyStateComponent } from '@rhombuskit/core';

@Component({
  selector: 'folio-posts-draft-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RhombusCardComponent, RhombusEmptyStateComponent],
  host: { class: 'contents' },
  styles: [`
    .column-header {
      border-left: 3px solid var(--border-strong);
      padding-left: 12px;
    }
    .post-item {
      transition: box-shadow var(--motion-duration-base) var(--motion-ease-standard), transform var(--motion-duration-base) var(--motion-ease-standard), background-color var(--motion-duration-fast) var(--motion-ease-standard);
    }
    .post-item:hover {
      box-shadow: var(--shadow-sm);
      transform: translateY(-1px);
    }
  `],
  template: `
    <rhombus-card variant="outlined" [hasHeader]="false" class="flex flex-col overflow-hidden page-enter">
      <div class="column-header shrink-0 flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <span class="text-sm font-semibold">Draft</span>
        <span class="inline-flex items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs font-medium min-w-[1.25rem] h-5 px-1.5">
          {{ posts().length }}
        </span>
      </div>

      <div class="kanban-column-body flex-1 divide-y divide-[var(--border)]">
        @for (post of posts(); track post.id) {
          <button
            type="button"
            class="post-item w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--surface-2)]"
            (click)="postSelected.emit(post.id)"
          >
            <span class="truncate text-sm font-medium">{{ post.title || '(Untitled)' }}</span>
            <span class="shrink-0 text-xs opacity-50">{{ post.updatedAt | date: 'mediumDate' }}</span>
          </button>
        } @empty {
          <rhombus-empty-state
            icon="edit_note"
            heading="No drafts"
            body="Posts you're working on will appear here."
          />
        }
      </div>
    </rhombus-card>
  `,
})
export class PostsDraftColumnComponent {
  posts = input.required<BlogPost[]>();
  postSelected = output<string>();
}
