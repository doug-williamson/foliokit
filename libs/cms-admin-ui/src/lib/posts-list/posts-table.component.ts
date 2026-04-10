import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
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
  imports: [DatePipe, MatButtonModule, MatIconModule, MatMenuModule],
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
      font-size: 9px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      font-weight: 400;
      color: var(--text-muted);
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
      text-align: left;
      white-space: nowrap;
    }

    tr:last-child td {
      border-bottom: none;
    }

    td {
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
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
      font-size: 10px;
      color: var(--text-muted);
    }

    .cell-meta {
      font-family: var(--font-mono);
      font-size: 10px;
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
      font-size: 10px;
    }

    /* Give the status column a fixed width so title gets the rest */
    .col-status {
      width: 120px;
      text-align: right;
      vertical-align: top;
    }

    .col-status .badge {
      display: inline-flex;
      justify-content: center;
    }

    /* Slug/Date column: hidden on mobile */
    .col-slug { display: none; }

    @media (min-width: 640px) {
      .col-slug {
        display: table-cell;
        width: 200px;
        min-width: 0;
        overflow: hidden;
      }
      .cell-title-meta { display: none; }
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
          <th class="col-slug">Slug / Date</th>
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
              </mat-menu>
            </td>
          </tr>
        }
        @if (allPosts().length === 0) {
          <tr>
            <td colspan="4" class="posts-table-empty" style="text-align: center; padding: 32px; color: var(--text-muted); font-family: var(--font-mono); font-size: 11px;">
              No posts yet
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

  protected readonly allPosts = computed<BlogPost[]>(() =>
    [...this.store.filteredPosts()].sort((a, b) => b.updatedAt - a.updatedAt),
  );

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
