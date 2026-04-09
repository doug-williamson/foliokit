import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import type { BlogPost } from '@foliokit/cms-core';
import { PostsListStore } from './posts-list.store';

@Component({
  selector: 'folio-posts-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  host: { class: 'block' },
  styles: [`
    :host { display: block; }

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
      display: block;
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 400;
      color: var(--text-muted);
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cell-meta {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .cell-meta-slug {
      display: block;
    }

    .cell-meta-date {
      display: block;
      margin-top: 2px;
    }

    /* Give the status column a fixed width so title gets the rest */
    .col-status { width: 110px; }

    /* Slug/Date column: hidden on mobile */
    .col-slug { display: none; }

    @media (min-width: 640px) {
      .col-slug { display: table-cell; width: 200px; }
      .cell-title-meta { display: none; }
    }
  `],
  template: `
    <table class="posts-table">
      <thead>
        <tr>
          <th>Title</th>
          <th class="col-slug">Slug / Date</th>
          <th class="col-status">Status</th>
        </tr>
      </thead>
      <tbody>
        @for (post of allPosts(); track post.id) {
          <tr (click)="postSelected.emit(post.id)">
            <td>
              <div class="cell-title">{{ post.title || 'Untitled' }}</div>
              <span class="cell-title-meta">/{{ post.slug }} · {{ post.updatedAt | date: 'MMM d, yyyy' }}</span>
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
          </tr>
        }
        @if (allPosts().length === 0) {
          <tr>
            <td colspan="3" style="text-align: center; padding: 32px; color: var(--text-muted); font-family: var(--font-mono); font-size: 11px;">
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

  postSelected = output<string>();

  protected readonly allPosts = computed<BlogPost[]>(() =>
    [...this.store.filteredPosts()].sort((a, b) => b.updatedAt - a.updatedAt),
  );

  badgeClass(status: BlogPost['status']): string {
    if (status === 'published') return 'badge-pub';
    if (status === 'scheduled') return 'badge-sched';
    if (status === 'archived') return 'badge-arch';
    return 'badge-draft';
  }

  badgeLabel(status: BlogPost['status']): string {
    if (status === 'published') return '● PUBLISHED';
    if (status === 'scheduled') return '● SCHEDULED';
    if (status === 'archived') return '● ARCHIVED';
    return '● DRAFT';
  }
}
