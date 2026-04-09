import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlanGatingService, Series } from '@foliokit/cms-core';
import { SeriesFormComponent } from './series-form.component';
import { TaxonomyStore } from './taxonomy.store';

@Component({
  selector: 'folio-taxonomy-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  template: `
    @if (!hasTaxonomy()) {
      <!-- Upgrade CTA for starter tenants -->
      <div class="max-w-xl mx-auto p-8">
        <div class="border rounded-xl p-6 flex flex-col gap-4" style="border-color: var(--border)">
          <div class="flex items-center gap-3">
            <mat-icon
              svgIcon="category"
              style="color: var(--text-accent); font-size: 2rem; width: 2rem; height: 2rem"
            />
            <div>
              <h2 class="text-lg font-semibold">Content Taxonomy</h2>
              <span class="text-xs font-bold" style="color: var(--text-accent)">PRO</span>
            </div>
          </div>
          <p class="text-sm" style="color: var(--text-muted)">
            Organise your posts into series and surface structured collections in your blog.
          </p>
          <div>
            <button mat-flat-button routerLink="/settings">
              Upgrade to Pro to unlock
            </button>
          </div>
        </div>
      </div>
    } @else {
      <!-- Full taxonomy UI -->
      <div class="flex flex-col h-full overflow-hidden">
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
        >
          <h1 class="text-xl font-semibold">Series</h1>
          <button mat-flat-button (click)="openNewSeries()">
            <mat-icon svgIcon="add" />
            New Series
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
          @if (store.loading()) {
            <div class="flex items-center justify-center p-12">
              <mat-spinner diameter="40" />
            </div>
          } @else {
            <div class="p-4 sm:p-6 flex flex-col gap-6">
              @if (store.error()) {
                <p class="text-sm text-red-600">{{ store.error() }}</p>
              }

              <!-- Empty state -->
              @if (store.series().length === 0) {
                <div class="flex flex-col items-center justify-center gap-4 p-12 opacity-50">
                  <mat-icon
                    svgIcon="category"
                    style="font-size: 4rem; width: 4rem; height: 4rem"
                  />
                  <p class="text-sm">No series yet. Create one to get started.</p>
                </div>
              } @else {
                <div
                  class="border rounded-lg overflow-hidden"
                  style="border-color: var(--border)"
                >
                  @for (s of store.series(); track s.id) {
                    <div
                      class="flex items-center gap-3 px-4 py-2 border-t text-sm"
                      style="border-color: color-mix(in srgb, currentColor 8%, transparent)"
                    >
                      <span class="flex-1 font-medium">{{ s.name }}</span>
                      <mat-slide-toggle
                        [checked]="s.isActive"
                        (change)="store.setSeriesActive(s.id, $event.checked)"
                        matTooltip="Active"
                      />
                      <button mat-icon-button matTooltip="Edit" (click)="openEditSeries(s)">
                        <mat-icon svgIcon="edit" />
                      </button>
                      <button mat-icon-button matTooltip="Delete" (click)="deleteSeries(s)">
                        <mat-icon svgIcon="delete" />
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class TaxonomyPageComponent implements OnInit {
  protected readonly store = inject(TaxonomyStore);
  private readonly planGating = inject(PlanGatingService);
  private readonly dialog = inject(MatDialog);

  protected readonly hasTaxonomy = this.planGating.hasPlatformFeature('taxonomy');

  ngOnInit(): void {
    if (this.hasTaxonomy()) {
      this.store.loadAll();
    }
  }

  protected openNewSeries(): void {
    this.dialog
      .open(SeriesFormComponent, { data: {} })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.store.createSeries(result);
      });
  }

  protected openEditSeries(s: Series): void {
    this.dialog
      .open(SeriesFormComponent, { data: { series: s } })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.store.updateSeries(s.id, result);
      });
  }

  protected deleteSeries(s: Series): void {
    if (!window.confirm(`Delete series "${s.name}"? This cannot be undone.`)) return;
    this.store.deleteSeries(s.id);
  }
}
