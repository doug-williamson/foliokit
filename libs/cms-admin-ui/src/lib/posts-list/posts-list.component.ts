import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  RhombusButtonComponent,
  RhombusChipDirective,
  RhombusChipGroupDirective,
  RhombusEmptyStateComponent,
  RhombusOverflowMenuComponent,
  type OverflowMenuItem,
} from '@rhombuskit/core';
import { PostsListStore, type PostFilterStatus } from './posts-list.store';
import { PostsTableComponent } from './posts-table.component';
import { PostsSectionComponent } from './posts-section.component';

@Component({
  selector: 'folio-posts-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PostsListStore],
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    PostsTableComponent,
    PostsSectionComponent,
    RhombusButtonComponent,
    RhombusChipDirective,
    RhombusChipGroupDirective,
    RhombusEmptyStateComponent,
    RhombusOverflowMenuComponent,
  ],
  host: { class: 'block h-full min-w-0 overflow-hidden' },
  styles: [`
    :host {
      display: block;
      height: 100%;
      min-width: 0;
      overflow: hidden;
    }

    .filter-bar {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px 16px 6px;
    }

    .filter-search { width: 100%; }

    .status-menu-btn { width: 100%; }

    .chip-scroll { display: none; }

    @media (min-width: 640px) {
      .filter-bar {
        flex-direction: row;
        align-items: center;
      }
      .filter-search { flex: 0 0 260px; width: auto; }
      .status-menu-btn { display: none; }
      .chip-scroll {
        display: block;
        flex: 1;
        min-width: 0;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .chip-scroll::-webkit-scrollbar { display: none; }
    }

    .empty-filter-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 16px;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
    }
  `],
  template: `
    <div class="flex flex-col h-full min-w-0 overflow-hidden">
      <div class="page-header shrink-0">
        <div class="page-header-title">
          <h1 class="page-heading">Posts</h1>
        </div>
        <div class="page-header-actions">
          <rhombus-button variant="secondary" (click)="newPost()">New Post</rhombus-button>
        </div>
      </div>

      @if (store.loading()) {
        <div class="flex-1 min-h-0 flex items-center justify-center">
          <mat-spinner diameter="40" />
        </div>
      } @else if (store.error()) {
        <div class="flex-1 min-h-0 flex items-center justify-center opacity-60 text-sm">
          Failed to load posts. Please try again.
        </div>
      } @else if (store.posts().length === 0) {
        <rhombus-empty-state
          class="flex-1 min-h-0"
          icon="edit_note"
          heading="No posts yet. Create one to get started."
        />
      } @else {
        <div class="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
        <div class="filter-bar shrink-0">
          <mat-form-field class="filter-search" appearance="outline" subscriptSizing="dynamic">
            <mat-label>Search</mat-label>
            <input
              matInput
              [value]="inputValue()"
              (input)="onSearchInput($any($event.target).value)"
              placeholder="Search posts…"
            />
          </mat-form-field>

          <!-- Mobile: dropdown -->
          <rhombus-overflow-menu
            class="status-menu-btn"
            [items]="statusMenuItems()"
            triggerIcon="filter_list"
            ariaLabel="Filter by status"
          />

          <!-- Tablet+: chip strip -->
          <div class="chip-scroll">
            <mat-chip-listbox
              rhombusChipGroup
              selection="single"
              hideSingleSelectionIndicator
              [value]="store.filterStatus()"
              (change)="store.setFilterStatus($event.value)"
            >
              <mat-chip-option rhombusChip variant="primary" value="all">All</mat-chip-option>
              <mat-chip-option rhombusChip variant="primary" value="draft" class="badge-draft">Draft</mat-chip-option>
              <mat-chip-option rhombusChip variant="primary" value="scheduled" class="badge-sched">Scheduled</mat-chip-option>
              <mat-chip-option rhombusChip variant="primary" value="published" class="badge-pub">Published</mat-chip-option>
              <mat-chip-option rhombusChip variant="primary" value="archived" class="badge-arch">Archived</mat-chip-option>
            </mat-chip-listbox>
          </div>
        </div>

        <div class="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden flex flex-col">
        @if (showSections()) {
          <folio-posts-section
            label="Drafts"
            status="draft"
            [posts]="trueDraftPosts()"
            emptyLabel="No drafts. Write something."
            (postSelected)="onPostSelected($event)"
            (viewAllClick)="onViewAll($event)"
          />
          <folio-posts-section
            label="Scheduled"
            status="scheduled"
            [posts]="store.scheduledPosts()"
            emptyLabel="Nothing scheduled."
            (postSelected)="onPostSelected($event)"
            (viewAllClick)="onViewAll($event)"
          />
          <folio-posts-section
            label="Published"
            status="published"
            [posts]="store.publishedPosts()"
            emptyLabel="No published posts yet."
            (postSelected)="onPostSelected($event)"
            (viewAllClick)="onViewAll($event)"
          />
          <folio-posts-section
            label="Archived"
            status="archived"
            [posts]="store.archivedPosts()"
            emptyLabel="No archived posts."
            [collapsible]="true"
            [defaultExpanded]="false"
            (postSelected)="onPostSelected($event)"
            (viewAllClick)="onViewAll($event)"
          />
        } @else {
          @if (store.filteredPosts().length === 0) {
            <div class="empty-filter-state shrink-0">
              No posts match your filter.
              <rhombus-button appearance="outlined" variant="secondary" (click)="clearFilters()">Clear filters</rhombus-button>
            </div>
          }

          <folio-posts-table
            class="flex-1 min-h-0 min-w-0 block"
            [interactive]="true"
            (postSelected)="onPostSelected($event)"
          />
        }
        </div>
        </div>
      }
    </div>
  `,
})
export class PostsListComponent implements OnInit {
  protected readonly store = inject(PostsListStore);
  private readonly router = inject(Router);

  protected readonly inputValue = signal('');
  private readonly filterText$ = new Subject<string>();

  protected readonly showSections = computed(
    () => this.store.filterStatus() === 'all' && !this.store.filterText().trim(),
  );

  protected readonly trueDraftPosts = computed(() =>
    this.store.posts().filter((p) => p.status === 'draft'),
  );

  protected readonly statusMenuItems = computed<OverflowMenuItem[]>(() => [
    { label: 'All', action: () => this.store.setFilterStatus('all') },
    { label: 'Draft', action: () => this.store.setFilterStatus('draft') },
    {
      label: 'Scheduled',
      action: () => this.store.setFilterStatus('scheduled'),
    },
    {
      label: 'Published',
      action: () => this.store.setFilterStatus('published'),
    },
    { label: 'Archived', action: () => this.store.setFilterStatus('archived') },
  ]);

  constructor() {
    this.filterText$
      .pipe(debounceTime(200), takeUntilDestroyed())
      .subscribe((text) => this.store.setFilterText(text));
  }

  ngOnInit(): void {
    this.store.loadPosts();
  }

  protected onSearchInput(value: string): void {
    this.inputValue.set(value);
    this.filterText$.next(value);
  }

  protected clearFilters(): void {
    this.inputValue.set('');
    this.store.setFilterText('');
    this.store.setFilterStatus('all');
  }

  protected newPost(): void {
    this.router.navigate(['/posts/new']);
  }

  protected onPostSelected(id: string): void {
    this.router.navigate(['/posts', id, 'edit']);
  }

  protected onViewAll(status: PostFilterStatus): void {
    this.store.setFilterStatus(status);
  }
}
