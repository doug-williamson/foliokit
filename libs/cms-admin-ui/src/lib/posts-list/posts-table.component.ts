import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { filter } from 'rxjs/operators';
import type { BlogPost } from '@foliokit/cms-core';
import {
  RhombusConfirmService,
  RhombusDataTableComponent,
  RhombusOverflowMenuComponent,
  type ColumnDef,
  type OverflowMenuItem,
  type SortState,
} from '@rhombuskit/core';
import { PostsListStore, type PostsSortColumn } from './posts-list.store';

/** Per-row cell template context emitted by `<rhombus-data-table>`. */
type Cell = { $implicit: BlogPost; index: number };

@Component({
  selector: 'folio-posts-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    RhombusDataTableComponent,
    RhombusOverflowMenuComponent,
  ],
  host: { class: 'block min-w-0' },
  styles: [`
    :host {
      display: block;
      min-width: 0;
    }

    /* ── Cell-content styling (table chrome is owned by rhombus-data-table) ── */
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

    /* The stacked title-meta is a mobile affordance; once the dedicated
       Slug/Date column appears (>=sm, via hideBelow:'sm'), hide it. */
    @media (min-width: 640px) {
      .cell-title-meta { display: none; }
    }
  `],
  template: `
    <rhombus-data-table
      [data]="allPosts()"
      [columns]="columns()"
      sortMode="controlled"
      [sortState]="sortState()"
      [paginated]="false"
      (sortChange)="onSortChange($event)"
      (rowClick)="postSelected.emit($event.id)"
    />

    <!-- ── Cell templates ───────────────────────────────────────────────── -->
    <ng-template #titleCell let-row>
      <div class="cell-title">{{ row.title || 'Untitled' }}</div>
      <span class="cell-title-meta">
        <span class="cell-title-meta-slug">/{{ row.slug }}</span>
        <span class="cell-title-meta-date">{{ row.updatedAt | date: 'MMM d, yyyy' }}</span>
      </span>
    </ng-template>

    <ng-template #dateCell let-row>
      <span class="cell-meta">
        <span class="cell-meta-slug">/{{ row.slug }}</span>
        <span class="cell-meta-date">{{ row.updatedAt | date: 'MMM d, yyyy' }}</span>
      </span>
    </ng-template>

    <ng-template #viewsCell let-row>{{ (row.viewCount ?? 0) | number }}</ng-template>

    <ng-template #statusCell let-row>
      <span [class]="'badge ' + badgeClass(row.status)">{{ badgeLabel(row.status) }}</span>
    </ng-template>

    <ng-template #actionsCell let-row>
      <span (click)="$event.stopPropagation()">
        <rhombus-overflow-menu
          [items]="rowMenuItems(row)"
          ariaLabel="Post actions"
        />
      </span>
    </ng-template>
  `,
})
export class PostsTableComponent {
  protected readonly store = inject(PostsListStore);
  private readonly confirm = inject(RhombusConfirmService);
  private readonly destroyRef = inject(DestroyRef);

  postSelected = output<string>();

  /** Explicit row set (section views). Falls back to the store's sorted list. */
  readonly posts = input<BlogPost[] | null>(null);

  /**
   * Interactive (main view): sortable headers, sort owned by the store.
   * Static (section mini-tables): non-sortable, fixed order from `[posts]`.
   */
  readonly interactive = input<boolean>(true);

  private readonly titleCell = viewChild<TemplateRef<Cell>>('titleCell');
  private readonly dateCell = viewChild<TemplateRef<Cell>>('dateCell');
  private readonly viewsCell = viewChild<TemplateRef<Cell>>('viewsCell');
  private readonly statusCell = viewChild<TemplateRef<Cell>>('statusCell');
  private readonly actionsCell = viewChild<TemplateRef<Cell>>('actionsCell');

  protected readonly allPosts = computed<BlogPost[]>(
    () => this.posts() ?? this.store.sortedPosts(),
  );

  /**
   * Controlled sort: the store is the sole authority. Reflected into the table
   * for the header affordance only. `null` when non-interactive so section
   * mini-tables render no sort indicator.
   */
  protected readonly sortState = computed<SortState | null>(() =>
    this.interactive()
      ? { active: this.store.sortBy(), direction: this.store.sortDirection() }
      : null,
  );

  protected readonly columns = computed<ColumnDef<BlogPost>[]>(() => {
    const sortable = this.interactive();
    return [
      { key: 'title', header: 'Title', align: 'start', cellTemplate: this.titleCell() },
      { key: 'updatedAt', header: 'Slug / Date', sortable, hideBelow: 'sm', cellTemplate: this.dateCell() },
      { key: 'viewCount', header: 'Views', sortable, align: 'end', hideBelow: 'sm', cellTemplate: this.viewsCell() },
      { key: 'status', header: 'Status', align: 'center', width: '120px', cellTemplate: this.statusCell() },
      { key: 'id', header: '', align: 'center', width: '40px', cellTemplate: this.actionsCell() },
    ];
  });

  /** Row action menu, reactive to the row's current status. */
  protected rowMenuItems(row: BlogPost): OverflowMenuItem[] {
    const items: OverflowMenuItem[] = [
      { label: 'Edit', action: () => this.postSelected.emit(row.id) },
    ];
    if (row.status === 'published') {
      items.push({ label: 'Unpublish', action: () => this.confirmUnpublish(row) });
    }
    if (row.status !== 'archived') {
      items.push({ label: 'Archive', action: () => this.confirmArchive(row) });
    }
    items.push({
      label: 'Delete…',
      action: () => this.confirmDelete(row),
      variant: 'danger',
      dividerBefore: row.status !== 'archived',
    });
    return items;
  }

  protected onSortChange(sort: SortState): void {
    // Drive the store's two-state toggle; it owns direction, not Material.
    this.store.toggleSort(sort.active as PostsSortColumn);
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
    this.confirm
      .confirm({
        title: 'Archive post?',
        message: `"${title}" will be hidden from the live site and moved to the archive.`,
        confirmLabel: 'Archive',
        cancelLabel: 'Cancel',
        variant: 'default',
      })
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.archivePost(post.id));
  }

  protected confirmDelete(post: BlogPost): void {
    const title = post.title?.trim() || 'Untitled';
    this.confirm
      .confirm({
        title: 'Delete post?',
        message: `Permanently delete "${title}"? This cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        variant: 'danger',
      })
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.deletePost(post.id));
  }

  protected confirmUnpublish(post: BlogPost): void {
    const title = post.title?.trim() || 'Untitled';
    this.confirm
      .confirm({
        title: 'Unpublish post?',
        message: `“${title}” will return to draft and will no longer be visible on the live site.`,
        confirmLabel: 'Unpublish',
        cancelLabel: 'Keep published',
        variant: 'danger',
      })
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.store.unpublishPost(post.id));
  }
}
