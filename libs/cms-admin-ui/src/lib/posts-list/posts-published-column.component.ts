import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'folio-posts-published-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatCardModule, MatButtonModule, MatIconModule],
  host: { class: 'contents' },
  styles: [`
    .column-header {
      border-left: 3px solid var(--green-600);
      padding-left: 12px;
    }
    :host-context([data-theme="dark"]) .column-header {
      border-left-color: var(--green-400);
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
    <mat-card appearance="outlined" class="flex flex-col overflow-hidden page-enter" style="animation-delay: 120ms">
      <div class="column-header shrink-0 flex items-center gap-2 px-4 py-3 border-b border-[var(--mat-sys-outline-variant)]">
        <span class="text-sm font-semibold">Published</span>
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
            <span class="shrink-0 text-xs opacity-50">{{ post.publishedAt | date: 'mediumDate' }}</span>
          </button>
        } @empty {
          <div class="empty-state">
            <mat-icon class="empty-state-icon" svgIcon="check_circle_outline" />
            <p class="empty-state-heading">Nothing published yet</p>
            <p class="empty-state-body">Your live posts will appear here.</p>
          </div>
        }

        @if (showArchived()) {
          @for (post of archivedPosts(); track post.id) {
            <button
              type="button"
              class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left opacity-50 hover:opacity-70 transition-opacity"
              (click)="postSelected.emit(post.id)"
            >
              <span class="truncate text-sm font-medium">{{ post.title || '(Untitled)' }}</span>
              <span class="shrink-0 text-xs">{{ post.updatedAt | date: 'mediumDate' }}</span>
            </button>
          }
        }
      </div>

      @if (archivedPosts().length > 0) {
        <div class="shrink-0 border-t border-[var(--mat-sys-outline-variant)] px-4 py-2">
          <button
            mat-button
            class="w-full text-xs"
            (click)="showArchived.set(!showArchived())"
          >
            <mat-icon class="text-sm mr-1" [svgIcon]="showArchived() ? 'expand_less' : 'expand_more'" />
            {{ showArchived() ? 'Hide archived' : 'Show archived (' + archivedPosts().length + ')' }}
          </button>
        </div>
      }
    </mat-card>
  `,
})
export class PostsPublishedColumnComponent {
  posts = input.required<BlogPost[]>();
  archivedPosts = input.required<BlogPost[]>();
  postSelected = output<string>();

  protected readonly showArchived = signal(false);
}
