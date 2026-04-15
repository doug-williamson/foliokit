import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Series } from '@foliokit/cms-core';
import { SeriesFormComponent } from './series-form.component';
import { TaxonomyStore } from './taxonomy.store';

@Component({
  selector: 'folio-taxonomy-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
        <!-- Header -->
        <div class="page-header flex items-center justify-between border-b shrink-0"
             style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
          <h1 class="page-heading">Series</h1>
          <button mat-flat-button (click)="openNewSeries()">
            New Series
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
          @if (store.loading()) {
            <div class="flex items-center justify-center p-12">
              <mat-spinner diameter="40" />
            </div>
          } @else if (store.series().length === 0) {
            <div class="flex flex-col items-center justify-center gap-6 p-12 opacity-50 h-full">
              <mat-icon style="font-size: 5rem; width: 5rem; height: 5rem" svgIcon="collections_bookmark" />
              <p>No series yet. Create one to get started.</p>
            </div>
          } @else {
            <div class="p-4 sm:p-6 flex flex-col gap-6">
              @if (store.error()) {
                <p class="text-sm text-red-600">{{ store.error() }}</p>
              }
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
            </div>
          }
        </div>
    </div>
  `,
})
export class TaxonomyPageComponent {
  protected readonly store = inject(TaxonomyStore);
  private readonly dialog = inject(MatDialog);

  constructor() {
    this.store.loadAll();
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
