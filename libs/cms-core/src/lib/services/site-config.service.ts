import { inject, Injectable, makeStateKey } from '@angular/core';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { defer, from, Observable, of } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { CollectionPaths } from '../firebase/collection-paths';
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
  private readonly paths = inject(CollectionPaths);

  getSiteConfig(siteId: string): Observable<SiteConfig | null> {
    if (!this.firestore) return of(null);
    const docPath = this.paths.siteConfigDocPath(siteId);
    const segments = docPath.split('/');
    const ref = doc(this.firestore, segments[0], ...segments.slice(1));
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
    return this.getSiteConfig(this.paths.siteId ?? 'default');
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

  saveSiteConfig(config: SiteConfig): Observable<SiteConfig> {
    if (!this.firestore) return of(config);
    const siteId = config.id || 'default';
    const nowMs = Date.now();
    const nowTs = Timestamp.fromMillis(nowMs);
    const saved: SiteConfig = { ...config, id: siteId, updatedAt: nowMs };
    const firestorePayload = stripUndefined({
      ...saved,
      updatedAt: nowTs,
    } as unknown as Record<string, unknown>);
    const docPath = this.paths.siteConfigDocPath(siteId);
    const segments = docPath.split('/');
    return defer(() =>
      setDoc(doc(this.firestore!, segments[0], ...segments.slice(1)), firestorePayload),
    ).pipe(
      map(() => saved),
      catchError((err) => {
        console.error('[SiteConfigService.saveSiteConfig]', err);
        throw err;
      }),
    );
  }
}
