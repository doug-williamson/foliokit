import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Pillar, PlanGatingService, Series } from '@foliokit/cms-core';
import { PillarFormComponent } from './pillar-form.component';
import { SeriesFormComponent } from './series-form.component';
import { TaxonomyStore } from './taxonomy.store';

// ── Inline reassign dialog (not exported) ─────────────────────────────────────

interface ReassignDialogData {
  series: Series;
  pillars: Pillar[];
}

@Component({
  selector: 'folio-reassign-pillar-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>Reassign Pillar</h2>
    <mat-dialog-content>
      <p class="text-sm mb-4" style="color: var(--text-muted)">
        Move "{{ data.series.name }}" to a different pillar.
      </p>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Pillar</mat-label>
        <mat-select [formControl]="ctrl">
          <mat-option [value]="null">No pillar (standalone)</mat-option>
          @for (p of data.pillars; track p.id) {
            <mat-option [value]="p.id">{{ p.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [mat-dialog-close]="ctrl.value">Reassign</button>
    </mat-dialog-actions>
  `,
})
class ReassignPillarDialogComponent {
  protected readonly data = inject<ReassignDialogData>(MAT_DIALOG_DATA);
  protected readonly ref = inject(MatDialogRef<ReassignPillarDialogComponent>);
  protected readonly ctrl = new FormControl<string | null>(this.data.series.pillarId);
}

// ── Main page ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'folio-pillars-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
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
            Organise your posts into pillars and series. Group related content, nest series under
            content pillars, and surface structured collections in your blog.
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
          <h1 class="text-xl font-semibold">Taxonomy</h1>
          <div class="flex gap-2">
            <button mat-stroked-button (click)="openNewSeries()">
              <mat-icon svgIcon="add" />
              New Series
            </button>
            <button mat-flat-button (click)="openNewPillar()">
              <mat-icon svgIcon="add" />
              New Pillar
            </button>
          </div>
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
              @if (store.pillars().length === 0 && store.series().length === 0) {
                <div class="flex flex-col items-center justify-center gap-4 p-12 opacity-50">
                  <mat-icon
                    svgIcon="category"
                    style="font-size: 4rem; width: 4rem; height: 4rem"
                  />
                  <p class="text-sm">No pillars or series yet. Create one to get started.</p>
                </div>
              }

              <!-- Pillar sections -->
              @for (pillar of store.pillars(); track pillar.id) {
                @let pillarSeries = (store.seriesByPillar())[pillar.id];
                <div
                  class="border rounded-lg overflow-hidden"
                  style="border-color: var(--border)"
                >
                  <div
                    class="flex items-center justify-between px-4 py-3 text-sm font-semibold"
                    style="background: color-mix(in srgb, currentColor 5%, transparent)"
                  >
                    <span>{{ pillar.name }}</span>
                    <div class="flex gap-1">
                      <button mat-icon-button matTooltip="Edit pillar" (click)="openEditPillar(pillar)">
                        <mat-icon svgIcon="edit" />
                      </button>
                      <button mat-icon-button matTooltip="Delete pillar" (click)="deletePillar(pillar)">
                        <mat-icon svgIcon="delete" />
                      </button>
                    </div>
                  </div>

                  @if (pillarSeries.length === 0) {
                    <div class="px-4 py-3 text-sm opacity-50">No series yet.</div>
                  } @else {
                    @for (s of pillarSeries; track s.id) {
                      <ng-container
                        [ngTemplateOutlet]="seriesRow"
                        [ngTemplateOutletContext]="{ $implicit: s }"
                      />
                    }
                  }
                </div>
              }

              <!-- Standalone / pillar-free series -->
              @if (store.pillarFreeSeries().length > 0 || store.pillars().length === 0) {
                <div
                  class="border rounded-lg overflow-hidden"
                  style="border-color: var(--border)"
                >
                  <div
                    class="flex items-center gap-2 px-4 py-3 text-sm font-semibold"
                    style="background: color-mix(in srgb, currentColor 5%, transparent)"
                  >
                    <span>Standalone Series</span>
                    <span class="opacity-50 text-xs">(no pillar)</span>
                  </div>

                  @if (store.pillarFreeSeries().length === 0) {
                    <div class="px-4 py-3 text-sm opacity-50">No standalone series.</div>
                  } @else {
                    @for (s of store.pillarFreeSeries(); track s.id) {
                      <ng-container
                        [ngTemplateOutlet]="seriesRow"
                        [ngTemplateOutletContext]="{ $implicit: s }"
                      />
                    }
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    }

    <!-- Series row template (used in both pillar sections and standalone section) -->
    <ng-template #seriesRow let-s>
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
        <button mat-icon-button matTooltip="Reassign pillar" (click)="openReassign(s)">
          <mat-icon svgIcon="swap_horiz" />
        </button>
        <button mat-icon-button matTooltip="Delete" (click)="deleteSeries(s)">
          <mat-icon svgIcon="delete" />
        </button>
      </div>
    </ng-template>
  `,
})
export class PillarsListComponent implements OnInit {
  protected readonly store = inject(TaxonomyStore);
  private readonly planGating = inject(PlanGatingService);
  private readonly dialog = inject(MatDialog);

  protected readonly hasTaxonomy = this.planGating.hasPlatformFeature('taxonomy');

  ngOnInit(): void {
    if (this.hasTaxonomy()) {
      this.store.loadAll();
    }
  }

  protected openNewPillar(): void {
    this.dialog
      .open(PillarFormComponent, { data: {} })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.store.createPillar(result);
      });
  }

  protected openEditPillar(pillar: Pillar): void {
    this.dialog
      .open(PillarFormComponent, { data: { pillar } })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.store.updatePillar(pillar.id, result);
      });
  }

  protected deletePillar(pillar: Pillar): void {
    if (!window.confirm(`Delete pillar "${pillar.name}"? This cannot be undone.`)) return;
    this.store.deletePillar(pillar.id);
  }

  protected openNewSeries(): void {
    this.dialog
      .open(SeriesFormComponent, { data: { pillars: this.store.pillars() } })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.store.createSeries(result);
      });
  }

  protected openEditSeries(s: Series): void {
    this.dialog
      .open(SeriesFormComponent, { data: { series: s, pillars: this.store.pillars() } })
      .afterClosed()
      .subscribe((result) => {
        if (result) this.store.updateSeries(s.id, result);
      });
  }

  protected openReassign(s: Series): void {
    this.dialog
      .open(ReassignPillarDialogComponent, {
        data: { series: s, pillars: this.store.pillars() },
      })
      .afterClosed()
      .subscribe((newPillarId: string | null | undefined) => {
        if (newPillarId !== undefined) {
          this.store.reassignSeries(s.id, newPillarId);
        }
      });
  }

  protected deleteSeries(s: Series): void {
    if (!window.confirm(`Delete series "${s.name}"? This cannot be undone.`)) return;
    this.store.deleteSeries(s.id);
  }
}
