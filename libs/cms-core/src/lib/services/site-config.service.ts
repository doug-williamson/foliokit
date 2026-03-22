import { inject, Injectable } from '@angular/core';
import { doc, getDoc } from 'firebase/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FIRESTORE } from '../firebase/firebase.config';
import type { SiteConfig } from '../models/site-config.model';
import { normalizeSiteConfig } from '../utils/normalize-site-config';

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly firestore = inject(FIRESTORE);

  getSiteConfig(siteId: string): Observable<SiteConfig | null> {
    const ref = doc(this.firestore, 'site-config', siteId);
    return from(getDoc(ref)).pipe(
      map((snap) => {
        if (!snap.exists()) return null;
        return normalizeSiteConfig({ id: snap.id, ...snap.data() });
      }),
      catchError((err) => {
        console.error('[SiteConfigService.getSiteConfig]', err);
        return of(null);
      }),
    );
  }

  getDefaultSiteConfig(): Observable<SiteConfig | null> {
    return this.getSiteConfig('default');
  }
}
