import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ResolveFn } from '@angular/router';
import { take } from 'rxjs/operators';
import { map } from 'rxjs';
import { SeriesService } from '@foliokit/cms-core';
import type { Series } from '@foliokit/cms-core';

const SERIES_ALL_KEY = makeStateKey<Series[]>('series-all');

export function createSeriesResolver(): ResolveFn<Series[]> {
  return () => {
    const transferState = inject(TransferState);
    const platformId = inject(PLATFORM_ID);

    if (transferState.hasKey(SERIES_ALL_KEY)) {
      const series = transferState.get(SERIES_ALL_KEY, []);
      transferState.remove(SERIES_ALL_KEY);
      return series;
    }

    if (!isPlatformBrowser(platformId)) {
      return [];
    }

    return inject(SeriesService).getAll().pipe(take(1));
  };
}

export function createSeriesDetailResolver(): ResolveFn<Series | null> {
  return (route) => {
    const slug = route.paramMap.get('slug') ?? '';
    const transferState = inject(TransferState);
    const platformId = inject(PLATFORM_ID);
    const stateKey = makeStateKey<Series | null>(`series-detail:${slug}`);

    if (transferState.hasKey(stateKey)) {
      const series = transferState.get(stateKey, null);
      transferState.remove(stateKey);
      return series;
    }

    if (!isPlatformBrowser(platformId)) {
      return null;
    }

    return inject(SeriesService).getAll().pipe(
      take(1),
      map((list) => list.find((s) => s.slug === slug) ?? null),
    );
  };
}
