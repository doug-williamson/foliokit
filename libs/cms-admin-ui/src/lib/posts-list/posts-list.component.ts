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
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostsListStore } from './posts-list.store';
import { PostsTableComponent } from './posts-table.component';

@Component({
  selector: 'folio-posts-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PostsListStore],
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    PostsTableComponent,
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
          <button mat-flat-button (click)="newPost()">New Post</button>
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
          <button mat-stroked-button class="status-menu-btn" [matMenuTriggerFor]="statusMenu">
            {{ filterStatusLabel() }}
          </button>
          <mat-menu #statusMenu>
            <button mat-menu-item (click)="store.setFilterStatus('all')">All</button>
            <button mat-menu-item (click)="store.setFilterStatus('draft')">Draft</button>
            <button mat-menu-item (click)="store.setFilterStatus('published')">Published</button>
          </mat-menu>

          <!-- Tablet+: chip strip -->
          <div class="chip-scroll">
            <mat-chip-listbox
              hideSingleSelectionIndicator
              [value]="store.filterStatus()"
              (change)="store.setFilterStatus($event.value)"
            >
              <mat-chip-option value="all">All</mat-chip-option>
              <mat-chip-option value="draft" class="badge-draft">Draft</mat-chip-option>
              <mat-chip-option value="published" class="badge-pub">Published</mat-chip-option>
            </mat-chip-listbox>
          </div>
        </div>

        <div class="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden flex flex-col">
        @if (store.filteredPosts().length === 0 && (inputValue() || store.filterStatus() !== 'all')) {
          <div class="empty-filter-state shrink-0">
            No posts match your filter.
            <button mat-stroked-button (click)="clearFilters()">Clear filters</button>
          </div>
        }

        <folio-posts-table
          class="flex-1 min-h-0 min-w-0 block"
          (postSelected)="onPostSelected($event)"
        />
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

  protected readonly filterStatusLabel = computed(() => {
    const s = this.store.filterStatus();
    if (s === 'all') return 'Status: All';
    return 'Status: ' + s.charAt(0).toUpperCase() + s.slice(1);
  });

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
}
