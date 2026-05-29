import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { take } from 'rxjs/operators';
import type { BlogPost } from '@foliokit/cms-core';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../shared/confirm-dialog/confirm-dialog.component';
import { PostsListStore } from './posts-list.store';

@Component({
  selector: 'folio-posts-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, MatButtonModule, MatDivider, MatIconModule, MatMenuModule],
  host: { class: 'block min-w-0' },
  styles: [`
    :host {
      display: block;
      min-width: 0;
    }

    .posts-table th.col-title,
    .posts-table td.col-title {
      max-width: 0;
      width: auto;
    }

    .posts-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      font-size: 12px;
    }

    th {
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 400;
      color: var(--text-muted);
      padding: 8px 12px;
      border-bottom: var(--border-width) solid var(--border);
      text-align: left;
      white-space: nowrap;
    }

    tr:last-child td {
      border-bottom: none;
    }

    td {
      padding: 8px 12px;
      border-bottom: var(--border-width) solid var(--border);
      vertical-align: middle;
    }

    tr:hover td {
      background: var(--surface-2);
      cursor: pointer;
    }

    .cell-title {
      font-family: var(--font-display);
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cell-title-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-family: var(--font-mono);
      font-size: 11px;
      font-weight: 400;
      color: var(--text-secondary);
      margin-top: 4px;
      min-width: 0;
    }

    .cell-title-meta-slug {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cell-title-meta-date {
      font-size: 11px;
      color: var(--text-muted);
    }

    .cell-meta {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      white-space: nowrap;
      min-width: 0;
      overflow: hidden;
    }

    .cell-meta-slug {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cell-meta-date {
      display: block;
      margin-top: 4px;
      font-size: 11px;
    }

    /* Give the status column a fixed width so title gets the rest */
    th.col-status {
      text-align: center;
    }

    .col-status {
      width: 120px;
      text-align: center;
      vertical-align: middle;
    }

    .col-status .badge {
      display: inline-flex;
      justify-content: center;
    }

    /* Slug/Date column: hidden on mobile */
    .col-slug { display: none; }

    /* Views column: hidden on mobile, right-aligned numeric on sm+. */
    .col-views { display: none; }
    th.col-views { text-align: right; }
    td.col-views {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-secondary);
    }

    @media (min-width: 640px) {
      .col-slug {
        display: table-cell;
        width: 200px;
        min-width: 0;
        overflow: hidden;
      }
      .col-views {
        display: table-cell;
        width: 80px;
      }
      .cell-title-meta { display: none; }
    }

    /* Sortable header button — inherits th typography. */
    .sort-header {
      all: unset;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font: inherit;
      letter-spacing: inherit;
      text-transform: inherit;
      color: inherit;
    }
    .sort-header:hover { color: var(--text-primary); }
    .sort-header-arrow {
      font-size: 10px;
      line-height: 1;
      opacity: 0.7;
    }

    /* Actions column: always visible, mobile-first */
    .col-actions {
      width: 40px;
      padding: 0 4px;
      text-align: center;
      vertical-align: middle;
    }
  `],
  template: `
    <table class="posts-table">
      <thead>
        <tr>
          <th class="col-title">Title</th>
          <th class="col-slug">
            <button
              type="button"
              class="sort-header"
              (click)="store.toggleSort('updatedAt')"
              [attr.aria-sort]="ariaSort('updatedAt')"
            >
              Slug / Date
              @if (store.sortBy() === 'updatedAt') {
                <span class="sort-header-arrow" aria-hidden="true">{{ sortArrow() }}</span>
              }
            </button>
          </th>
          <th class="col-views">
            <button
              type="button"
              class="sort-header"
              (click)="store.toggleSort('viewCount')"
              [attr.aria-sort]="ariaSort('viewCount')"
            >
              Views
              @if (store.sortBy() === 'viewCount') {
                <span class="sort-header-arrow" aria-hidden="true">{{ sortArrow() }}</span>
              }
            </button>
          </th>
          <th class="col-status">Status</th>
          <th class="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        @for (post of allPosts(); track post.id) {
          <tr (click)="postSelected.emit(post.id)">
            <td class="col-title">
              <div class="cell-title">{{ post.title || 'Untitled' }}</div>
              <span class="cell-title-meta">
                <span class="cell-title-meta-slug">/{{ post.slug }}</span>
                <span class="cell-title-meta-date">{{ post.updatedAt | date: 'MMM d, yyyy' }}</span>
              </span>
            </td>
            <td class="col-slug">
              <span class="cell-meta">
                <span class="cell-meta-slug">/{{ post.slug }}</span>
                <span class="cell-meta-date">{{ post.updatedAt | date: 'MMM d, yyyy' }}</span>
              </span>
            </td>
            <td class="col-views">{{ (post.viewCount ?? 0) | number }}</td>
            <td class="col-status">
              <span [class]="'badge ' + badgeClass(post.status)">{{ badgeLabel(post.status) }}</span>
            </td>
            <td class="col-actions">
              <button
                mat-icon-button
                [matMenuTriggerFor]="rowMenu"
                aria-label="Post actions"
                (click)="$event.stopPropagation()"
              >
                <mat-icon svgIcon="more_vert" />
              </button>
              <mat-menu #rowMenu>
                <button mat-menu-item (click)="postSelected.emit(post.id)">Edit</button>
                @if (post.status === 'published') {
                  <button mat-menu-item (click)="confirmUnpublish(post)">Unpublish</button>
                }
                @if (post.status !== 'archived') {
                  <button mat-menu-item (click)="confirmArchive(post)">Archive</button>
                }
                @if (post.status !== 'archived') {
                  <mat-divider />
                }
                <button
                  mat-menu-item
                  [style.color]="'var(--error)'"
                  (click)="confirmDelete(post)"
                >
                  Delete…
                </button>
              </mat-menu>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class PostsTableComponent {
  protected readonly store = inject(PostsListStore);
  private readonly dialog = inject(MatDialog);

  postSelected = output<string>();

  readonly posts = input<BlogPost[] | null>(null);

  protected readonly allPosts = computed<BlogPost[]>(() => {
    const override = this.posts();
    // When a caller passes an explicit [posts] input (e.g. section views),
    // honor that ordering. Otherwise consume the store's sortedPosts.
    return override ?? this.store.sortedPosts();
  });

  protected sortArrow(): string {
    return this.store.sortDirection() === 'asc' ? '↑' : '↓';
  }

  protected ariaSort(column: 'updatedAt' | 'viewCount'): 'ascending' | 'descending' | 'none' {
    if (this.store.sortBy() !== column) return 'none';
    return this.store.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  badgeClass(status: BlogPost['status']): string {
    if (status === 'published') return 'badge-pub';
    if (status === 'archived') return 'badge-arch';
    return 'badge-draft';
  }

  badgeLabel(status: BlogPost['status']): string {
    if (status === 'published') return 'PUBLISHED';
    if (status === 'archived') return 'ARCHIVED';
    return 'DRAFT';
  }

  protected confirmArchive(post: BlogPost): void {
    const title = post.title?.trim() || 'Untitled';
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: 'Archive post?',
          message: `"${title}" will be hidden from the live site and moved to the archive.`,
          confirmLabel: 'Archive',
          cancelLabel: 'Cancel',
          destructive: false,
        },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (confirmed) this.store.archivePost(post.id);
      });
  }

  protected confirmDelete(post: BlogPost): void {
    const title = post.title?.trim() || 'Untitled';
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: 'Delete post?',
          message: `Permanently delete "${title}"? This cannot be undone.`,
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (confirmed) this.store.deletePost(post.id);
      });
  }

  protected confirmUnpublish(post: BlogPost): void {
    const title = post.title?.trim() || 'Untitled';
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
        if (confirmed) this.store.unpublishPost(post.id);
      });
  }
}
