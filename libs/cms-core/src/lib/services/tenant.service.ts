import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FIRESTORE } from '../firebase/firebase.config';
import type { TenantConfig } from '../models/tenant-config.model';

/**
 * Manages tenant configuration documents in Firestore.
 *
 * Tenant documents live at `tenants/{tenantId}` and store ownership,
 * domain routing, and display metadata. These documents are the
 * authority for tenant-scoped Firestore security rules — the
 * `ownerEmail` field is checked by `isTenantAdmin()` in
 * `firestore.rules`.
 */
@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly firestore = inject(FIRESTORE);

  getTenant(tenantId: string): Observable<TenantConfig | null> {
    if (!this.firestore) return of(null);
    const ref = doc(this.firestore, 'tenants', tenantId);
    return from(getDoc(ref)).pipe(
      map((snap) => {
        if (!snap.exists()) return null;
        return { tenantId: snap.id, ...snap.data() } as TenantConfig;
      }),
      catchError((err) => {
        console.error('[TenantService.getTenant]', err);
        return of(null);
      }),
    );
  }

  createTenant(config: TenantConfig): Observable<TenantConfig> {
    if (!this.firestore) return of(config);
    const nowTs = Timestamp.now();
    const payload = {
      ...config,
      createdAt: nowTs,
      updatedAt: nowTs,
    };
    // Remove tenantId from the document body — it's the document ID.
    const { tenantId: _, ...data } = payload;
    return from(
      setDoc(doc(this.firestore, 'tenants', config.tenantId), data),
    ).pipe(
      map(() => ({ ...config, createdAt: nowTs, updatedAt: nowTs }) as unknown as TenantConfig),
      catchError((err) => {
        console.error('[TenantService.createTenant]', err);
        throw err;
      }),
    );
  }

  updateTenant(
    tenantId: string,
    updates: Partial<Omit<TenantConfig, 'tenantId' | 'createdAt'>>,
  ): Observable<void> {
    if (!this.firestore) return of(undefined);
    return from(
      updateDoc(doc(this.firestore, 'tenants', tenantId), {
        ...updates,
        updatedAt: Timestamp.now(),
      }),
    ).pipe(
      catchError((err) => {
        console.error('[TenantService.updateTenant]', err);
        throw err;
      }),
    );
  }
}
