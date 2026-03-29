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
import type { Author } from '../models/author.model';
import { normalizeAuthor } from '../utils/normalize-author';

@Injectable({ providedIn: 'root' })
export class AuthorService {
  private readonly firestore = inject(FIRESTORE)!;
  private readonly paths = inject(CollectionPaths);

  getAll(): Observable<Author[]> {
    const q = query(
      collection(this.firestore, this.paths.collection('authors')),
      orderBy('displayName', 'asc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizeAuthor({ id: d.id, ...d.data() })),
      ),
      catchError((err) => {
        console.error('[AuthorService.getAll]', err);
        return of([]);
      }),
    );
  }

  getById(id: string): Observable<Author | null> {
    return from(getDoc(doc(this.firestore, this.paths.collection('authors'), id))).pipe(
      map((snap) => {
        if (!snap.exists()) return null;
        return normalizeAuthor({ id: snap.id, ...snap.data() });
      }),
      catchError((err) => {
        console.error('[AuthorService.getById]', err);
        return of(null);
      }),
    );
  }

  create(data: Omit<Author, 'id' | 'createdAt' | 'updatedAt'>): Observable<Author> {
    const nowMs = Date.now();
    const nowTs = Timestamp.fromMillis(nowMs);
    const newId = doc(collection(this.firestore, this.paths.collection('authors'))).id;
    const author: Author = { ...data, id: newId, createdAt: nowMs, updatedAt: nowMs };
    const firestorePayload = { ...author, createdAt: nowTs, updatedAt: nowTs };
    return from(setDoc(doc(this.firestore, this.paths.collection('authors'), newId), firestorePayload)).pipe(
      map(() => author),
      catchError((err) => {
        console.error('[AuthorService.create]', err);
        throw err;
      }),
    );
  }

  update(id: string, data: Partial<Omit<Author, 'id' | 'createdAt'>>): Observable<void> {
    const nowTs = Timestamp.fromMillis(Date.now());
    return from(
      updateDoc(doc(this.firestore, this.paths.collection('authors'), id), { ...data, updatedAt: nowTs }),
    ).pipe(
      catchError((err) => {
        console.error('[AuthorService.update]', err);
        throw err;
      }),
    );
  }

  delete(id: string): Observable<void> {
    return from(deleteDoc(doc(this.firestore, this.paths.collection('authors'), id))).pipe(
      catchError((err) => {
        console.error('[AuthorService.delete]', err);
        throw err;
      }),
    );
  }
}
