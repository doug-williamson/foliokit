import { InjectionToken, makeStateKey } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Series } from '../models/series.model';

export interface ISeriesService {
  getAll(): Observable<Series[]>;
  getById(id: string): Observable<Series | null>;
}

export const SERIES_SERVICE = new InjectionToken<ISeriesService>(
  'SERIES_SERVICE',
);

export const SERIES_TRANSFER_KEY = makeStateKey<Series[]>('series-list');
