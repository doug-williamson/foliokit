import { inject, Injectable, makeStateKey } from '@angular/core';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { defer, from, Observable, of } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { FIRESTORE } from '../firebase/firebase.config';
import type { AboutPageConfig, SiteConfig } from '../models/site-config.model';
import { normalizeSiteConfig } from '../utils/normalize-site-config';
import type { ISiteConfigService } from '../tokens/site-config-service.token';

export const ABOUT_CONFIG_TRANSFER_KEY = makeStateKey<AboutPageConfig | null>('about-config');

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
      result[key] = stripUndefined(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

@Injectable({ providedIn: 'root' })
export class SiteConfigService implements ISiteConfigService {
  private readonly firestore = inject(FIRESTORE);

  getSiteConfig(siteId: string): Observable<SiteConfig | null> {
    if (!this.firestore) return of(null);
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

  /** Returns the default SiteConfig, filtering out null (no-document) results. */
  getConfig(): Observable<SiteConfig> {
    return this.getDefaultSiteConfig().pipe(
      filter((c): c is SiteConfig => c !== null),
    );
  }

  /**
   * Convenience method that maps the default SiteConfig to its pages.about field.
   * Does not make a separate Firestore read.
   * TransferState hydration is handled by the aboutPageResolver in the blog app.
   */
  getAboutConfig(): Observable<AboutPageConfig | null> {
    return this.getConfig().pipe(
      map((c) => c.pages?.about ?? null),
    );
  }

  getFeatures(): Observable<NonNullable<SiteConfig['features']>> {
    return this.getConfig().pipe(
      map((c) => c.features ?? { aboutEnabled: false, linksEnabled: false }),
    );
  }

  saveSiteConfig(config: SiteConfig): Observable<SiteConfig> {
    if (!this.firestore) return of(config);
    const siteId = config.id || 'default';
    const nowMs = Date.now();
    const nowTs = Timestamp.fromMillis(nowMs);
    const saved: SiteConfig = { ...config, id: siteId, updatedAt: nowMs };
    const { features, pages, ...rest } = saved;
    const firestorePayload = stripUndefined({
      ...rest,
      updatedAt: nowTs,
      pages: { ...pages, ...features },
    } as unknown as Record<string, unknown>);
    return defer(() =>
      setDoc(doc(this.firestore!, 'site-config', siteId), firestorePayload),
    ).pipe(
      map(() => saved),
      catchError((err) => {
        console.error('[SiteConfigService.saveSiteConfig]', err);
        throw err;
      }),
    );
  }
}
