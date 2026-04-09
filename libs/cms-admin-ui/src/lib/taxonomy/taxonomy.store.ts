import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import type { Series } from '@foliokit/cms-core';
import { SeriesService } from '@foliokit/cms-core';

export interface TaxonomyState {
  series: Series[];
  loading: boolean;
  error: string | null;
}

const initialState: TaxonomyState = {
  series: [],
  loading: false,
  error: null,
};

export const TaxonomyStore = signalStore(
  withState<TaxonomyState>(initialState),

  withMethods(
    (
      store,
      seriesService = inject(SeriesService),
    ) => {
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
          seriesService.getAll().subscribe({
            next: (series) => patchState(store, { series, loading: false }),
            error: (err: unknown) =>
              patchState(store, {
                loading: false,
                error: err instanceof Error ? err.message : 'Load failed',
              }),
          });
        },

        createSeries(data: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>): void {
          seriesService.create(data).subscribe({
            next: () => reloadSeries(),
            error: (err: unknown) =>
              patchState(store, { error: err instanceof Error ? err.message : 'Create failed' }),
          });
        },

        updateSeries(id: string, data: Partial<Omit<Series, 'id' | 'createdAt'>>): void {
          seriesService.update(id, data).subscribe({
            next: () => reloadSeries(),
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

        _reloadSeries: reloadSeries,
      };
    },
  ),
);
