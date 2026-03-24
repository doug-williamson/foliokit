import { Injectable } from '@angular/core';
import { getFirestore } from 'firebase-admin/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ISiteConfigService } from '@foliokit/cms-core';
import { normalizeSiteConfig } from '@foliokit/cms-core/utils/normalize-site-config';
import type { AboutPageConfig, SiteConfig } from '@foliokit/cms-core';

const DEFAULT_FEATURES: NonNullable<SiteConfig['features']> = {
  aboutEnabled: false,
  linksEnabled: false,
};

@Injectable()
export class ServerSiteConfigService implements ISiteConfigService {
  getAboutConfig(): Observable<AboutPageConfig | null> {
    const db = getFirestore();
    return from(db.collection('site-config').doc('default').get()).pipe(
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

  getFeatures(): Observable<NonNullable<SiteConfig['features']>> {
    const db = getFirestore();
    return from(db.collection('site-config').doc('default').get()).pipe(
      map((snap) => {
        if (!snap.exists) return DEFAULT_FEATURES;
        const config = normalizeSiteConfig({
          id: snap.id,
          ...(snap.data() as Record<string, unknown>),
        });
        return config.features ?? DEFAULT_FEATURES;
      }),
      catchError((err) => {
        console.error('[ServerSiteConfigService.getFeatures]', err);
        return of(DEFAULT_FEATURES);
      }),
    );
  }
}
