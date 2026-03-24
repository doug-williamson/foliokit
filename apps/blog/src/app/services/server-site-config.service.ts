import { Injectable } from '@angular/core';
import { getFirestore } from 'firebase-admin/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { ISiteConfigService } from '@foliokit/cms-core';
import { normalizeSiteConfig } from '@foliokit/cms-core/utils/normalize-site-config';
import type { AboutPageConfig, SiteConfig } from '@foliokit/cms-core';

@Injectable()
export class ServerSiteConfigService implements ISiteConfigService {
  getConfig(): Observable<SiteConfig> {
    const db = getFirestore();
    return from(db.collection('site-config').doc('default').get()).pipe(
      map((snap) => {
        if (!snap.exists) return null;
        return normalizeSiteConfig({
          id: snap.id,
          ...(snap.data() as Record<string, unknown>),
        });
      }),
      filter((c): c is SiteConfig => c !== null),
      catchError((err) => {
        console.error('[ServerSiteConfigService.getConfig]', err);
        return of(null as unknown as SiteConfig);
      }),
    );
  }

  getAboutConfig(): Observable<AboutPageConfig | null> {
    return from(getFirestore().collection('site-config').doc('default').get()).pipe(
      map((snap) => {
        if (!snap.exists) return null;
        const config = normalizeSiteConfig({
          id: snap.id,
          ...(snap.data() as Record<string, unknown>),
        });
        return config.pages?.about ?? null;
      }),
      catchError((err) => {
        console.error('[ServerSiteConfigService.getAboutConfig]', err);
        return of(null);
      }),
    );
  }
}
