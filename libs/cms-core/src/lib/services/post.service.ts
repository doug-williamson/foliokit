import { inject, Injectable } from '@angular/core';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
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
}
