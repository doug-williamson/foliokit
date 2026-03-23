import { inject, Injectable } from '@angular/core';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FIRESTORE } from '../firebase/firebase.config';
import type { SiteConfig } from '../models/site-config.model';
import { normalizeSiteConfig } from '../utils/normalize-site-config';

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  // Non-null assertion is safe: SiteConfigService is only used in the browser
  // where FIRESTORE is always initialized.
  private readonly firestore = inject(FIRESTORE)!;

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

  saveSiteConfig(config: SiteConfig): Observable<SiteConfig> {
    const siteId = config.id || 'default';
    const nowMs = Date.now();
    const nowTs = Timestamp.fromMillis(nowMs);
    const saved: SiteConfig = { ...config, id: siteId, updatedAt: nowMs };
    const firestorePayload = { ...saved, updatedAt: nowTs };
    return from(
      setDoc(doc(this.firestore, 'site-config', siteId), firestorePayload),
    ).pipe(
      map(() => saved),
      catchError((err) => {
        console.error('[SiteConfigService.saveSiteConfig]', err);
        throw err;
      }),
    );
  }
}
