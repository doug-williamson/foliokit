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
import type { Pillar } from '../models/pillar.model';

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

function normalizePillar(raw: Record<string, unknown>): Pillar {
  return {
    id: (raw['id'] as string) ?? '',
    slug: (raw['slug'] as string) ?? '',
    name: (raw['name'] as string) ?? '',
    description: raw['description'] as string | undefined,
    createdAt: normalizeTimestamp(raw['createdAt']),
    updatedAt: normalizeTimestamp(raw['updatedAt']),
  };
}

@Injectable({ providedIn: 'root' })
export class PillarService {
  private readonly firestore = inject(FIRESTORE)!;
  private readonly paths = inject(CollectionPaths);

  getAll(): Observable<Pillar[]> {
    const q = query(
      collection(this.firestore, this.paths.collection('pillars')),
      orderBy('name', 'asc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizePillar({ id: d.id, ...d.data() })),
      ),
      catchError((err) => {
        console.error('[PillarService.getAll]', err);
        return of([]);
      }),
    );
  }

  getById(id: string): Observable<Pillar | null> {
    return from(getDoc(doc(this.firestore, this.paths.collection('pillars'), id))).pipe(
      map((snap) => {
        if (!snap.exists()) return null;
        return normalizePillar({ id: snap.id, ...snap.data() });
      }),
      catchError((err) => {
        console.error('[PillarService.getById]', err);
        return of(null);
      }),
    );
  }

  create(data: Omit<Pillar, 'id' | 'createdAt' | 'updatedAt'>): Observable<string> {
    const nowMs = Date.now();
    const nowTs = Timestamp.fromMillis(nowMs);
    const newId = doc(collection(this.firestore, this.paths.collection('pillars'))).id;
    const pillar: Pillar = { ...data, id: newId, createdAt: nowMs, updatedAt: nowMs };
    const firestorePayload = { ...pillar, createdAt: nowTs, updatedAt: nowTs };
    return from(
      setDoc(doc(this.firestore, this.paths.collection('pillars'), newId), firestorePayload),
    ).pipe(
      map(() => newId),
      catchError((err) => {
        console.error('[PillarService.create]', err);
        throw err;
      }),
    );
  }

  update(id: string, data: Partial<Omit<Pillar, 'id' | 'createdAt'>>): Observable<void> {
    const nowTs = Timestamp.fromMillis(Date.now());
    return from(
      updateDoc(
        doc(this.firestore, this.paths.collection('pillars'), id),
        { ...(data as Record<string, unknown>), updatedAt: nowTs },
      ),
    ).pipe(
      catchError((err) => {
        console.error('[PillarService.update]', err);
        throw err;
      }),
    );
  }

  delete(id: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, this.paths.collection('pillars'), id))).pipe(
      catchError((err) => {
        console.error('[PillarService.delete]', err);
        throw err;
      }),
    );
  }
}
