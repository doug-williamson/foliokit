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
import type { CmsPageUnion } from '../models/page.model';
import { normalizePage } from '../utils/normalize-page';
import type { IPageService } from '../tokens/page-service.token';

function omitUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

/**
 * @deprecated PageService is superseded by SiteConfigService.getAboutConfig() for the
 * About page. The /pages Firestore collection remains intact for LinksPage. This class
 * will be removed in a future release once LinksPage is also migrated.
 */
@Injectable({ providedIn: 'root' })
export class PageService implements IPageService {
  // Non-null assertions are safe: PageService is only active in the browser
  // where FIRESTORE and FIREBASE_STORAGE are always initialized.
  // On the server, BLOG_PAGE_SERVICE resolves to ServerPageService instead.
  private readonly firestore = inject(FIRESTORE)!;
  private readonly storage = inject(FIREBASE_STORAGE)!;

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
        console.error('[PageService.getPageBySlug]', err);
        return of(null);
      }),
    );
  }

  getAllPages(): Observable<CmsPageUnion[]> {
    const q = query(
      collection(this.firestore, 'pages'),
      orderBy('updatedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizePage({ id: d.id, ...d.data() })),
      ),
      catchError((err) => {
        console.error('[PageService.getAllPages]', err);
        return of([]);
      }),
    );
  }

  getPageById(id: string): Observable<CmsPageUnion> {
    return from(getDoc(doc(this.firestore, 'pages', id))).pipe(
      map((snapshot) => {
        if (!snapshot.exists()) throw new Error(`Page not found: ${id}`);
        return normalizePage({ id: snapshot.id, ...snapshot.data() });
      }),
    );
  }

  deleteStorageFile(storagePath: string): Observable<void> {
    const fileRef = ref(this.storage, storagePath);
    return from(deleteObject(fileRef));
  }

  savePage(page: CmsPageUnion): Observable<CmsPageUnion> {
    const nowMs = Date.now();
    const nowTs = Timestamp.fromMillis(nowMs);

    if (page.id === '') {
      const newId =
        page.type === 'links'
          ? page.type
          : doc(collection(this.firestore, 'pages')).id;
      const savedPage: CmsPageUnion = { ...page, id: newId, createdAt: nowMs, updatedAt: nowMs };
      const firestorePayload = omitUndefined({ ...savedPage, createdAt: nowTs, updatedAt: nowTs });
      return from(
        setDoc(doc(this.firestore, 'pages', newId), firestorePayload),
      ).pipe(
        map(() => savedPage),
        catchError((err) => {
          console.error('[PageService.savePage/create]', err);
          throw err;
        }),
      );
    }

    const savedPage: CmsPageUnion = { ...page, updatedAt: nowMs };
    const firestorePayload = omitUndefined({ ...savedPage, updatedAt: nowTs });
    return from(
      updateDoc(doc(this.firestore, 'pages', page.id), firestorePayload),
    ).pipe(
      map(() => savedPage),
      catchError((err) => {
        console.error('[PageService.savePage/update]', err);
        throw err;
      }),
    );
  }
}
