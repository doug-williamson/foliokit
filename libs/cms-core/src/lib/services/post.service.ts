import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FIRESTORE } from '../firebase/firebase.config';
import type { BlogPost } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly firestore = inject(FIRESTORE);

  getPublishedPosts(): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, 'posts'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as BlogPost),
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
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as BlogPost;
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
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as BlogPost),
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
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as BlogPost),
      ),
      catchError((err) => {
        console.error('[PostService.getAllPosts]', err);
        return of([]);
      }),
    );
  }

  getPostById(id: string): Observable<BlogPost | null> {
    const ref = doc(collection(this.firestore, 'posts'), id);
    return from(getDoc(ref)).pipe(
      map((snapshot) => {
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() } as BlogPost;
      }),
      catchError((err) => {
        console.error('[PostService.getPostById]', err);
        return of(null);
      }),
    );
  }

  savePost(post: BlogPost): Observable<BlogPost> {
    const now = Timestamp.now();
    const isNew = !post.id;

    if (isNew) {
      const { id: _id, ...data } = post;
      const payload = { ...data, createdAt: now, updatedAt: now };
      return from(addDoc(collection(this.firestore, 'posts'), payload)).pipe(
        map((ref) => ({ ...post, id: ref.id, createdAt: now, updatedAt: now })),
        catchError((err) => {
          console.error('[PostService.savePost/create]', err);
          throw err;
        }),
      );
    }

    const { id, ...data } = post;
    const payload = { ...data, updatedAt: now };
    const ref = doc(collection(this.firestore, 'posts'), id);
    return from(setDoc(ref, payload, { merge: true })).pipe(
      map(() => ({ ...post, updatedAt: now })),
      catchError((err) => {
        console.error('[PostService.savePost/update]', err);
        throw err;
      }),
    );
  }
}
