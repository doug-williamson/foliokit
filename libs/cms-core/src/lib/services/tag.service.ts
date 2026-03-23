import { inject, Injectable } from '@angular/core';
import { collection, getDocs } from 'firebase/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FIRESTORE } from '../firebase/firebase.config';
import type { Tag } from '../models/tag.model';

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly firestore = inject(FIRESTORE);

  getAllTags(): Observable<Tag[]> {
    if (!this.firestore) return of([]);
    return from(getDocs(collection(this.firestore, 'tags'))).pipe(
      map((snapshot) =>
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Tag),
      ),
      catchError((err) => {
        console.error('[TagService.getAllTags]', err);
        return of([]);
      }),
    );
  }
}
