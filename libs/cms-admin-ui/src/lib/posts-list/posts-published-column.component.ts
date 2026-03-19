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
  template: `
    <mat-card appearance="outlined" class="flex flex-col overflow-hidden">
      <div class="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-[var(--mat-sys-outline-variant)]">
        <span class="text-sm font-semibold">Published</span>
        <span class="inline-flex items-center justify-center rounded-full bg-[var(--mat-sys-secondary-container)] text-[var(--mat-sys-on-secondary-container)] text-xs font-medium min-w-[1.25rem] h-5 px-1.5">
          {{ posts().length }}
        </span>
      </div>

      <div class="flex-1 overflow-y-auto divide-y divide-[var(--mat-sys-outline-variant)]">
        @for (post of posts(); track post.id) {
          <button
            type="button"
            class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--mat-sys-surface-container-high)] transition-colors"
            (click)="postSelected.emit(post.id)"
          >
            <span class="truncate text-sm font-medium">{{ post.title || '(Untitled)' }}</span>
            <span class="shrink-0 text-xs opacity-50">{{ post.publishedAt.toDate() | date: 'mediumDate' }}</span>
          </button>
        } @empty {
          <div class="py-10 text-center text-sm opacity-40">No published posts</div>
        }

        @if (showArchived()) {
          @for (post of archivedPosts(); track post.id) {
            <button
              type="button"
              class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left opacity-50 hover:opacity-70 transition-opacity"
              (click)="postSelected.emit(post.id)"
            >
              <span class="truncate text-sm font-medium">{{ post.title || '(Untitled)' }}</span>
              <span class="shrink-0 text-xs">{{ post.updatedAt.toDate() | date: 'mediumDate' }}</span>
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
            <mat-icon class="text-sm mr-1">{{ showArchived() ? 'expand_less' : 'expand_more' }}</mat-icon>
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
