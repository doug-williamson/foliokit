import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  FIRESTORE,
  IPageService,
  normalizePage,
} from '@foliokit/cms-core';
import type { CmsPageUnion } from '@foliokit/cms-core';

@Injectable()
export class ClientPageService implements IPageService {
  private readonly firestore = inject(FIRESTORE);

  getPageBySlug(slug: string): Observable<CmsPageUnion | null> {
    const q = query(
      collection(this.firestore, 'pages'),
      where('status', '==', 'published'),
      where('slug', '==', slug),
      limit(1),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        if (snapshot.empty) return null;
        const d = snapshot.docs[0];
        return normalizePage({ id: d.id, ...d.data() });
      }),
      catchError((err) => {
        console.error('[ClientPageService.getPageBySlug]', err);
        return of(null);
      }),
    );
  }

  getPageById(id: string): Observable<CmsPageUnion | null> {
    return from(getDoc(doc(this.firestore, 'pages', id))).pipe(
      map((snapshot) => {
        if (!snapshot.exists()) return null;
        return normalizePage({ id: snapshot.id, ...snapshot.data() });
      }),
      catchError((err) => {
        console.error('[ClientPageService.getPageById]', err);
        return of(null);
      }),
    );
  }
}
