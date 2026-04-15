import { inject, Injectable, REQUEST_CONTEXT } from '@angular/core';
import { getFirestore } from 'firebase-admin/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IBlogPostService, resolveCollectionPath, SITE_ID } from '@foliokit/cms-core';
import { normalizePost } from '@foliokit/cms-core/utils/normalize-post';
import type { BlogPost, SeriesNavItem } from '@foliokit/cms-core';

@Injectable()
export class ServerBlogPostService implements IBlogPostService {
  private readonly siteId = inject(SITE_ID, { optional: true });
  private readonly requestContext = inject(REQUEST_CONTEXT, { optional: true }) as
    | { tenantId?: string }
    | null
    | undefined;

  getPublishedPosts(): Observable<BlogPost[]> {
    const db = getFirestore();
    const q = db
      .collection(resolveCollectionPath('posts', this.siteId))
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

  getPublishedPostsBySeriesId(seriesId: string): Observable<SeriesNavItem[]> {
    const db = getFirestore();
    const q = db
      .collection(resolveCollectionPath('posts', this.siteId))
      .where('status', '==', 'published')
      .where('seriesId', '==', seriesId)
      .orderBy('seriesOrder', 'asc');
    return from(q.get()).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            slug: data['slug'] as string,
            title: data['title'] as string,
            seriesOrder: (data['seriesOrder'] as number) ?? 0,
          };
        }),
      ),
      catchError((err) => {
        console.error('[ServerBlogPostService.getPublishedPostsBySeriesId]', err);
        return of([]);
      }),
    );
  }

  getPostBySlug(slug: string): Observable<BlogPost | null> {
    const db = getFirestore();
    const collectionPath = resolveCollectionPath('posts', this.siteId);
    const q = db
      .collection(collectionPath)
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
