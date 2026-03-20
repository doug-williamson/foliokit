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
import {
  FIRESTORE,
  IBlogPostService,
  normalizePost,
} from '@foliokit/cms-core';
import type { BlogPost } from '@foliokit/cms-core';

@Injectable()
export class ClientBlogPostService implements IBlogPostService {
  private readonly firestore = inject(FIRESTORE);

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
        console.error('[ClientBlogPostService.getPublishedPosts]', err);
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
        console.error('[ClientBlogPostService.getPostBySlug]', err);
        return of(null);
      }),
    );
  }
}
