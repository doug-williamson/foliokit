import { inject, Injectable } from '@angular/core';
import { getFirestore } from 'firebase-admin/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { IAuthorService, resolveCollectionPath, SITE_ID } from '@foliokit/cms-core';
import { normalizeAuthor } from '@foliokit/cms-core/utils/normalize-author';
import type { Author } from '@foliokit/cms-core';

@Injectable()
export class ServerAuthorService implements IAuthorService {
  private readonly siteId = inject(SITE_ID, { optional: true });

  getById(id: string): Observable<Author | null> {
    const db = getFirestore();
    const docRef = db
      .collection(resolveCollectionPath('authors', this.siteId))
      .doc(id);
    return from(docRef.get()).pipe(
      map((snap) => {
        if (!snap.exists) return null;
        return normalizeAuthor({ id: snap.id, ...(snap.data() as Record<string, unknown>) });
      }),
      catchError((err) => {
        console.error('[ServerAuthorService.getById]', err);
        return of(null);
      }),
    );
  }
}
