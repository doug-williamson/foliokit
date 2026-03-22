import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase/firebase.config';
import type { BlogPost } from '../models/post.model';
import { normalizePost } from '../utils/normalize-post';
import type { IBlogPostService } from '../tokens/post-service.token';

@Injectable({ providedIn: 'root' })
export class PostService implements IBlogPostService {
  private readonly firestore = inject(FIRESTORE);
  private readonly storage = inject(FIREBASE_STORAGE);

  getPublishedPosts(): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, 'posts'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizePost({ id: d.id, ...d.data() })),
      ),
      catchError((err) => {
        console.error('[PostService.getPublishedPosts]', err);
        return of([]);
      }),
    );
  }

  getPostBySlug(slug: string): Observable<BlogPost | null> {
    const q = query(
      collection(this.firestore, 'posts'),
      where('status', '==', 'published'),
      where('slug', '==', slug),
      limit(1),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        if (snapshot.empty) return null;
        const d = snapshot.docs[0];
        return normalizePost({ id: d.id, ...d.data() });
      }),
      catchError((err) => {
        console.error('[PostService.getPostBySlug]', err);
        return of(null);
      }),
    );
  }

  getPostsByTag(tag: string): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, 'posts'),
      where('status', '==', 'published'),
      where('tags', 'array-contains', tag),
      orderBy('publishedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizePost({ id: d.id, ...d.data() })),
      ),
      catchError((err) => {
        console.error('[PostService.getPostsByTag]', err);
        return of([]);
      }),
    );
  }

  getAllPosts(): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, 'posts'),
      orderBy('updatedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizePost({ id: d.id, ...d.data() })),
      ),
      catchError((err) => {
        console.error('[PostService.getAllPosts]', err);
        return of([]);
      }),
    );
  }

  getPostById(id: string): Observable<BlogPost> {
    return from(getDoc(doc(this.firestore, 'posts', id))).pipe(
      map((snapshot) => {
        if (!snapshot.exists()) throw new Error(`Post not found: ${id}`);
        return normalizePost({ id: snapshot.id, ...snapshot.data() });
      }),
    );
  }

  deleteStorageFile(storagePath: string): Observable<void> {
    const fileRef = ref(this.storage, storagePath);
    return from(deleteObject(fileRef));
  }

  savePost(post: BlogPost): Observable<BlogPost> {
    const nowMs = Date.now();
    const nowTs = Timestamp.fromMillis(nowMs);

    if (post.id === '') {
      const newId = doc(collection(this.firestore, 'posts')).id;
      const savedPost: BlogPost = { ...post, id: newId, createdAt: nowMs, updatedAt: nowMs };
      // Write Timestamp objects to Firestore for proper ordering/querying
      const firestorePayload = { ...savedPost, createdAt: nowTs, updatedAt: nowTs };
      return from(
        setDoc(doc(this.firestore, 'posts', newId), firestorePayload),
      ).pipe(
        map(() => savedPost),
        catchError((err) => {
          console.error('[PostService.savePost/create]', err);
          throw err;
        }),
      );
    }

    const savedPost: BlogPost = { ...post, updatedAt: nowMs };
    const firestorePayload = { ...savedPost, updatedAt: nowTs };
    return from(
      updateDoc(doc(this.firestore, 'posts', post.id), firestorePayload),
    ).pipe(
      map(() => savedPost),
      catchError((err) => {
        console.error('[PostService.savePost/update]', err);
        throw err;
      }),
    );
  }
}
