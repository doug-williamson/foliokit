import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import type { Pillar, Series } from '@foliokit/cms-core';
import { PillarService, SeriesService } from '@foliokit/cms-core';

export interface TaxonomyState {
  pillars: Pillar[];
  series: Series[];
  loading: boolean;
  error: string | null;
}

const initialState: TaxonomyState = {
  pillars: [],
  series: [],
  loading: false,
  error: null,
};

export const TaxonomyStore = signalStore(
  withState<TaxonomyState>(initialState),

  withComputed((store) => ({
    pillarFreeSeries: computed(() => store.series().filter((s) => s.pillarId === null)),
    seriesByPillar: computed((): Record<string, Series[]> => {
      const map: Record<string, Series[]> = {};
      for (const s of store.series()) {
        if (s.pillarId !== null) {
          (map[s.pillarId] ??= []).push(s);
        }
      }
      return map;
    }),
  })),

  withMethods(
    (
      store,
      pillarService = inject(PillarService),
      seriesService = inject(SeriesService),
    ) => {
      function reloadPillars() {
        pillarService.getAll().subscribe({
          next: (pillars) => patchState(store, { pillars }),
          error: (err: unknown) =>
            patchState(store, { error: err instanceof Error ? err.message : 'Reload failed' }),
        });
      }
      function reloadSeries() {
        seriesService.getAll().subscribe({
          next: (series) => patchState(store, { series }),
          error: (err: unknown) =>
            patchState(store, { error: err instanceof Error ? err.message : 'Reload failed' }),
        });
      }

      return {
        loadAll(): void {
          patchState(store, { loading: true, error: null });
          forkJoin({ pillars: pillarService.getAll(), series: seriesService.getAll() }).subscribe({
            next: ({ pillars, series }) => patchState(store, { pillars, series, loading: false }),
            error: (err: unknown) =>
              patchState(store, {
                loading: false,
                error: err instanceof Error ? err.message : 'Load failed',
              }),
          });
        },

        createPillar(data: Omit<Pillar, 'id' | 'createdAt' | 'updatedAt'>): void {
          pillarService.create(data).pipe(switchMap(() => pillarService.getAll())).subscribe({
            next: (pillars) => patchState(store, { pillars }),
            error: (err: unknown) =>
              patchState(store, { error: err instanceof Error ? err.message : 'Create failed' }),
          });
        },

        updatePillar(id: string, data: Partial<Omit<Pillar, 'id' | 'createdAt'>>): void {
          pillarService.update(id, data).pipe(switchMap(() => pillarService.getAll())).subscribe({
            next: (pillars) => patchState(store, { pillars }),
            error: (err: unknown) =>
              patchState(store, { error: err instanceof Error ? err.message : 'Update failed' }),
          });
        },

        deletePillar(id: string): void {
          pillarService.delete(id).subscribe({
            next: () => patchState(store, { pillars: store.pillars().filter((p) => p.id !== id) }),
            error: (err: unknown) =>
              patchState(store, { error: err instanceof Error ? err.message : 'Delete failed' }),
          });
        },

        createSeries(data: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>): void {
          seriesService.create(data).pipe(switchMap(() => seriesService.getAll())).subscribe({
            next: (series) => patchState(store, { series }),
            error: (err: unknown) =>
              patchState(store, { error: err instanceof Error ? err.message : 'Create failed' }),
          });
        },

        updateSeries(id: string, data: Partial<Omit<Series, 'id' | 'createdAt'>>): void {
          seriesService.update(id, data).pipe(switchMap(() => seriesService.getAll())).subscribe({
            next: (series) => patchState(store, { series }),
            error: (err: unknown) =>
              patchState(store, { error: err instanceof Error ? err.message : 'Update failed' }),
          });
        },

        deleteSeries(id: string): void {
          seriesService.delete(id).subscribe({
            next: () => patchState(store, { series: store.series().filter((s) => s.id !== id) }),
            error: (err: unknown) =>
              patchState(store, { error: err instanceof Error ? err.message : 'Delete failed' }),
          });
        },

        setSeriesActive(id: string, isActive: boolean): void {
          seriesService.setActive(id, isActive).subscribe({
            next: () =>
              patchState(store, {
                series: store.series().map((s) => (s.id === id ? { ...s, isActive } : s)),
              }),
            error: (err: unknown) =>
              patchState(store, { error: err instanceof Error ? err.message : 'Update failed' }),
          });
        },

        reassignSeries(id: string, newPillarId: string | null): void {
          seriesService.reassignPillar(id, newPillarId).subscribe({
            next: () =>
              patchState(store, {
                series: store
                  .series()
                  .map((s) => (s.id === id ? { ...s, pillarId: newPillarId } : s)),
              }),
            error: (err: unknown) =>
              patchState(store, { error: err instanceof Error ? err.message : 'Update failed' }),
          });
        },

        _reloadPillars: reloadPillars,
        _reloadSeries: reloadSeries,
      };
    },
  ),
);
