import { inject, Injectable, makeStateKey } from '@angular/core';
import { doc, DocumentReference, getDoc, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';
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

  getSiteConfig(tenantId: string): Observable<SiteConfig | null> {
    if (!this.firestore) return of(null);
    const docPath = this.paths.siteConfigDocPath(tenantId);
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
    return this.getSiteConfig(this.paths.tenantId ?? 'default');
  }

  /**
   * Live updates when the default site-config document changes (browser only).
   * Use in admin UI; prefer {@link getDefaultSiteConfig} for one-shot reads (SSR, resolvers).
   */
  watchDefaultSiteConfig(): Observable<SiteConfig | null> {
    const ref = this.defaultSiteConfigDocRef();
    if (!ref) return of(null);
    return new Observable<SiteConfig | null>((subscriber) => {
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) {
            subscriber.next(null);
            return;
          }
          subscriber.next(
            normalizeSiteConfig({ id: snap.id, ...(snap.data() as object) }),
          );
        },
        (err) => subscriber.error(err),
      );
      return () => unsub();
    });
  }

  private defaultSiteConfigDocRef(): DocumentReference | null {
    if (!this.firestore) return null;
    const docPath = this.paths.siteConfigDocPath(this.paths.tenantId ?? 'default');
    const segments = docPath.split('/');
    return doc(this.firestore, segments[0], ...segments.slice(1));
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

  /**
   * Ensures the tenant document at `tenants/{tenantId}` exists before the
   * first write. Called during initial site setup when Firestore is empty.
   *
   * No-op when not in multi-tenant mode (no `SITE_ID` / root-level paths).
   * Creates a minimal tenant document with `ownerEmail` matching the current
   * user — satisfying the `isTenantOwner()` security rule on subsequent writes.
   */
  ensureTenantDoc(ownerEmail: string): Observable<void> {
    if (!this.firestore || !this.paths.tenantId) return of(undefined);
    const tenantId = this.paths.tenantId;
    const tenantRef = doc(this.firestore, 'tenants', tenantId);
    const now = Timestamp.now();
    // Attempt a create (setDoc without merge). The security rule allows this
    // when ownerEmail matches the authenticated user's email. If PERMISSION_DENIED
    // is returned it means the document already exists (updates are admin-only),
    // so the tenant is already provisioned — treat as a no-op and proceed.
    return from(
      setDoc(tenantRef, {
        tenantId,
        ownerEmail,
        subdomain: tenantId,
        customDomain: null,
        displayName: tenantId,
        createdAt: now,
        updatedAt: now,
      }),
    ).pipe(
      catchError((err: unknown) => {
        if ((err as { code?: string })?.code === 'permission-denied') {
          return of(undefined);
        }
        console.error('[SiteConfigService.ensureTenantDoc]', err);
        throw err;
      }),
    );
  }

  saveSiteConfig(config: SiteConfig): Observable<SiteConfig> {
    if (!this.firestore) return of(config);
    const tenantId = config.id || 'default';
    const nowMs = Date.now();
    const nowTs = Timestamp.fromMillis(nowMs);
    const saved: SiteConfig = { ...config, id: tenantId, updatedAt: nowMs };
    const firestorePayload = stripUndefined({
      ...saved,
      updatedAt: nowTs,
    } as unknown as Record<string, unknown>);
    const docPath = this.paths.siteConfigDocPath(tenantId);
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
