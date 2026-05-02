import { inject, Injectable } from '@angular/core';
import { getFirestore } from 'firebase-admin/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { ISiteConfigService, resolveSiteConfigDocPath, SITE_ID } from '@foliokit/cms-core';
import { normalizeSiteConfig } from '@foliokit/cms-core/utils/normalize-site-config';
import type { AboutPageConfig, SiteConfig } from '@foliokit/cms-core';

@Injectable()
export class ServerSiteConfigService implements ISiteConfigService {
  private readonly siteId = inject(SITE_ID, { optional: true });

  getSiteConfig(): Observable<SiteConfig | null> {
    const db = getFirestore();
    const docPath = resolveSiteConfigDocPath(this.siteId ?? 'default', this.siteId);
    return from(db.doc(docPath).get()).pipe(
      map((snap) => {
        if (!snap.exists) return null;
        return normalizeSiteConfig({
          id: snap.id,
          ...(snap.data() as Record<string, unknown>),
        });
      }),
      catchError((err) => {
        console.error('[ServerSiteConfigService.getSiteConfig]', err);
        return of(null);
      }),
    );
  }

  getDefaultSiteConfig(): Observable<SiteConfig | null> {
    return this.getSiteConfig();
  }

  getConfig(): Observable<SiteConfig> {
    const db = getFirestore();
    const docPath = resolveSiteConfigDocPath(this.siteId ?? 'default', this.siteId);
    return from(db.doc(docPath).get()).pipe(
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
    return this.getSiteConfig().pipe(map((c) => c?.pages?.about ?? null));
  }
}
