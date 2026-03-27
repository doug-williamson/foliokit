import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'folio-posts-draft-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatCardModule, MatIconModule],
  host: { class: 'contents' },
  styles: [`
    .column-header {
      border-left: 3px solid var(--border-strong);
      padding-left: 12px;
    }
    .post-item {
      transition: box-shadow 0.15s ease, transform 0.15s ease, background-color 0.12s;
    }
    .post-item:hover {
      box-shadow: var(--shadow-sm);
      transform: translateY(-1px);
    }
  `],
  template: `
    <mat-card appearance="outlined" class="flex flex-col overflow-hidden">
      <div class="column-header shrink-0 flex items-center gap-2 px-4 py-3 border-b border-[var(--mat-sys-outline-variant)]">
        <span class="text-sm font-semibold">Draft</span>
        <span class="inline-flex items-center justify-center rounded-full bg-[var(--mat-sys-secondary-container)] text-[var(--mat-sys-on-secondary-container)] text-xs font-medium min-w-[1.25rem] h-5 px-1.5">
          {{ posts().length }}
        </span>
      </div>

      <div class="kanban-column-body flex-1 divide-y divide-[var(--mat-sys-outline-variant)]">
        @for (post of posts(); track post.id) {
          <button
            type="button"
            class="post-item w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--mat-sys-surface-container-high)]"
            (click)="postSelected.emit(post.id)"
          >
            <span class="truncate text-sm font-medium">{{ post.title || '(Untitled)' }}</span>
            <span class="shrink-0 text-xs opacity-50">{{ post.updatedAt | date: 'mediumDate' }}</span>
          </button>
        } @empty {
          <div class="empty-state">
            <mat-icon class="empty-state-icon">edit_note</mat-icon>
            <p class="empty-state-heading">No drafts</p>
            <p class="empty-state-body">Posts you're working on will appear here.</p>
          </div>
        }
      </div>
    </mat-card>
  `,
})
export class PostsDraftColumnComponent {
  posts = input.required<BlogPost[]>();
  postSelected = output<string>();
}
