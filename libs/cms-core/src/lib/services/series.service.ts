import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CollectionPaths } from '../firebase/collection-paths';
import { FIRESTORE } from '../firebase/firebase.config';
import type { Series } from '../models/series.model';

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
    title: (raw['title'] as string) ?? undefined,
    description: raw['description'] as string | undefined,
    tenantId: (raw['tenantId'] as string) ?? undefined,
    postCount: typeof raw['postCount'] === 'number' ? raw['postCount'] : 0,
    isActive: raw['isActive'] === true,
    createdAt: normalizeTimestamp(raw['createdAt']),
    updatedAt: normalizeTimestamp(raw['updatedAt']),
  };
}

@Injectable({ providedIn: 'root' })
export class SeriesService {
  private readonly firestore = inject(FIRESTORE)!;
  private readonly paths = inject(CollectionPaths);

  getAll(): Observable<Series[]> {
    const q = query(
      collection(this.firestore, this.paths.collection('series')),
      orderBy('name', 'asc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizeSeries({ id: d.id, ...d.data() })),
      ),
      catchError((err) => {
        console.error('[SeriesService.getAll]', err);
        return of([]);
      }),
    );
  }

  getById(id: string): Observable<Series | null> {
    return from(getDoc(doc(this.firestore, this.paths.collection('series'), id))).pipe(
      map((snap) => {
        if (!snap.exists()) return null;
        return normalizeSeries({ id: snap.id, ...snap.data() });
      }),
      catchError((err) => {
        console.error('[SeriesService.getById]', err);
        return of(null);
      }),
    );
  }

  create(data: Omit<Series, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const nowMs = Date.now();
    const nowTs = Timestamp.fromMillis(nowMs);
    const newId = doc(collection(this.firestore, this.paths.collection('series'))).id;
    const series: Series = { ...data, id: newId, createdAt: nowMs, updatedAt: nowMs };
    const firestorePayload = { ...series, createdAt: nowTs, updatedAt: nowTs };
    return from(
      setDoc(doc(this.firestore, this.paths.collection('series'), newId), firestorePayload),
    ).pipe(
      map(() => newId),
      catchError((err) => {
        console.error('[SeriesService.create]', err);
        throw err;
      }),
    );
  }

  update(id: string, data: Partial<Omit<Series, 'id' | 'createdAt'>>): Observable<void> {
    const nowTs = Timestamp.fromMillis(Date.now());
    return from(
      updateDoc(
        doc(this.firestore, this.paths.collection('series'), id),
        { ...(data as Record<string, unknown>), updatedAt: nowTs },
      ),
    ).pipe(
      catchError((err) => {
        console.error('[SeriesService.update]', err);
        throw err;
      }),
    );
  }

  setActive(id: string, isActive: boolean): Observable<void> {
    return this.update(id, { isActive });
  }

  delete(id: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, this.paths.collection('series'), id))).pipe(
      catchError((err) => {
        console.error('[SeriesService.delete]', err);
        throw err;
      }),
    );
  }
}
