import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { take } from 'rxjs/operators';
import { BlogPost } from '@foliokit/cms-core';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'folio-posts-published-column',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatMenuModule],
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
          <div
            class="post-item flex items-center hover:bg-[var(--mat-sys-surface-container-high)]"
          >
            <button
              type="button"
              class="flex-1 flex items-center justify-between gap-3 px-4 py-3 text-left min-w-0"
              (click)="postSelected.emit(post.id)"
            >
              <span class="truncate text-sm font-medium">{{ post.title || '(Untitled)' }}</span>
              <span class="shrink-0 text-xs opacity-50">{{ post.publishedAt | date: 'mediumDate' }}</span>
            </button>
            <button
              mat-icon-button
              [matMenuTriggerFor]="cardMenu"
              aria-label="Post actions"
              class="shrink-0 mr-1"
              (click)="$event.stopPropagation()"
            >
              <mat-icon svgIcon="more_vert" />
            </button>
            <mat-menu #cardMenu>
              <button mat-menu-item (click)="confirmUnpublish(post)">Unpublish</button>
            </mat-menu>
          </div>
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
  private readonly dialog = inject(MatDialog);

  posts = input.required<BlogPost[]>();
  archivedPosts = input.required<BlogPost[]>();
  postSelected = output<string>();
  unpublishPost = output<string>();

  protected readonly showArchived = signal(false);

  protected confirmUnpublish(post: BlogPost): void {
    const title = post.title?.trim() || '(Untitled)';
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: 'Unpublish post?',
          message: `“${title}” will return to draft and will no longer be visible on the live site.`,
          confirmLabel: 'Unpublish',
          cancelLabel: 'Keep published',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (confirmed) this.unpublishPost.emit(post.id);
      });
  }
}
