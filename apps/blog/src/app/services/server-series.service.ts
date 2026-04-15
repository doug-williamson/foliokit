import { inject, Injectable } from '@angular/core';
import { getFirestore } from 'firebase-admin/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { resolveCollectionPath, SeriesService, SITE_ID } from '@foliokit/cms-core';
import type { Series } from '@foliokit/cms-core';

function normalizeTimestamp(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof (v as { toMillis?: unknown }).toMillis === 'function') {
      return (v as { toMillis(): number }).toMillis();
    }
    if (typeof (v as { toDate?: unknown }).toDate === 'function') {
      return (v as { toDate(): Date }).toDate().getTime();
    }
    if (typeof v['_seconds'] === 'number') {
      return (v['_seconds'] as number) * 1000 +
        Math.floor(((v['_nanoseconds'] as number) ?? 0) / 1e6);
    }
    if (typeof v['seconds'] === 'number') {
      return (v['seconds'] as number) * 1000 +
        Math.floor(((v['nanoseconds'] as number) ?? 0) / 1e6);
    }
  }
  return 0;
}

function normalizeSeries(raw: Record<string, unknown>): Series {
  return {
    id: (raw['id'] as string) ?? '',
    slug: (raw['slug'] as string) ?? '',
    name: (raw['name'] as string) ?? '',
    title: raw['title'] as string | undefined,
    description: raw['description'] as string | undefined,
    tenantId: raw['tenantId'] as string | undefined,
    postCount: typeof raw['postCount'] === 'number' ? raw['postCount'] : 0,
    isActive: raw['isActive'] === true,
    createdAt: normalizeTimestamp(raw['createdAt']),
    updatedAt: normalizeTimestamp(raw['updatedAt']),
  };
}

/**
 * Server-side (Admin SDK) implementation of {@link SeriesService}.
 * Provided in `app.config.server.ts` via `{ provide: SeriesService, useClass: ServerSeriesService }`,
 * overriding the default client-SDK service whose FIRESTORE dependency is null during SSR.
 */
@Injectable()
export class ServerSeriesService {
  private readonly siteId = inject(SITE_ID, { optional: true });

  getById(id: string): Observable<Series | null> {
    const db = getFirestore();
    const docRef = db
      .collection(resolveCollectionPath('series', this.siteId))
      .doc(id);
    return from(docRef.get()).pipe(
      map((snap) => {
        if (!snap.exists) return null;
        return normalizeSeries({ id: snap.id, ...(snap.data() as Record<string, unknown>) });
      }),
      catchError((err) => {
        console.error('[ServerSeriesService.getById]', err);
        return of(null);
      }),
    );
  }

  /** Not used during SSR — series list/detail pages skip server fetch intentionally. */
  getAll(): Observable<Series[]> {
    return of([]);
  }
}
