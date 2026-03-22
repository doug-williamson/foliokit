import { Injectable } from '@angular/core';
import { getFirestore } from 'firebase-admin/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IBlogPostService } from '@foliokit/cms-core';
import { normalizePost } from '@foliokit/cms-core/utils/normalize-post';
import type { BlogPost } from '@foliokit/cms-core';

@Injectable()
export class ServerBlogPostService implements IBlogPostService {
  getPublishedPosts(): Observable<BlogPost[]> {
    const db = getFirestore();
    const q = db
      .collection('posts')
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc');
    return from(q.get()).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) =>
          normalizePost({ id: d.id, ...(d.data() as Record<string, unknown>) }),
        ),
      ),
      catchError((err) => {
        console.error('[ServerBlogPostService.getPublishedPosts]', err);
        return of([]);
      }),
    );
  }

  getPostBySlug(slug: string): Observable<BlogPost | null> {
    const db = getFirestore();
    const q = db
      .collection('posts')
      .where('status', '==', 'published')
      .where('slug', '==', slug)
      .limit(1);
    return from(q.get()).pipe(
      map((snapshot) => {
        if (snapshot.empty) return null;
        const d = snapshot.docs[0];
        return normalizePost({ id: d.id, ...(d.data() as Record<string, unknown>) });
      }),
      catchError((err) => {
        console.error('[ServerBlogPostService.getPostBySlug]', err);
        return of(null);
      }),
    );
  }
}
