import { Injectable } from '@angular/core';
import { getFirestore } from 'firebase-admin/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IPageService } from '@foliokit/cms-core';
import { normalizePage } from '@foliokit/cms-core/utils/normalize-page';
import type { CmsPageUnion } from '@foliokit/cms-core';

@Injectable()
export class ServerPageService implements IPageService {
  getPageBySlug(slug: string): Observable<CmsPageUnion | null> {
    const db = getFirestore();
    const q = db
      .collection('pages')
      .where('status', '==', 'published')
      .where('slug', '==', slug)
      .limit(1);
    return from(q.get()).pipe(
      map((snapshot) => {
        if (snapshot.empty) return null;
        const d = snapshot.docs[0];
        return normalizePage({ id: d.id, ...(d.data() as Record<string, unknown>) });
      }),
      catchError((err) => {
        console.error('[ServerPageService.getPageBySlug]', err);
        return of(null);
      }),
    );
  }

  getPageById(id: string): Observable<CmsPageUnion | null> {
    const db = getFirestore();
    return from(db.collection('pages').doc(id).get()).pipe(
      map((snapshot) => {
        if (!snapshot.exists) return null;
        return normalizePage({ id: snapshot.id, ...(snapshot.data() as Record<string, unknown>) });
      }),
      catchError((err) => {
        console.error('[ServerPageService.getPageById]', err);
        return of(null);
      }),
    );
  }
}
