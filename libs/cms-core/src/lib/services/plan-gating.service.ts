import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { doc, DocumentData, DocumentSnapshot, onSnapshot } from 'firebase/firestore';
import { catchError, distinctUntilChanged, map, Observable, of, shareReplay } from 'rxjs';
import { FIRESTORE } from '../firebase/firebase.config';
import { PLAN_GATING_BYPASS, SITE_ID } from '../firebase/foliokit.providers';
import type { PageType, PlatformFeatures, TenantFeatures } from '../models/plan-features.model';
import { TIER_FEATURES } from '../models/plan-features.model';
import type { BillingRecord, PlanTier } from '../models/billing-record.model';

@Injectable({ providedIn: 'root' })
export class PlanGatingService {
  private readonly firestore = inject(FIRESTORE)!;
  private readonly siteId = inject(SITE_ID, { optional: true });

  private readonly bypassGating = inject(PLAN_GATING_BYPASS, { optional: true }) ?? false;

  private readonly snapshot$: Observable<DocumentSnapshot<DocumentData> | null> = this.siteId
    ? new Observable<DocumentSnapshot<DocumentData>>(subscriber =>
        onSnapshot(
          doc(this.firestore, `billing/${this.siteId}`),
          snap => subscriber.next(snap),
          err => subscriber.error(err),
        )
      ).pipe(
        catchError(() => of(null)),
        shareReplay(1),
      )
    : of(null);

  readonly plan: Signal<PlanTier> = toSignal(
    this.bypassGating
      ? of<PlanTier>('agency_internal')
      : this.snapshot$.pipe(
          map(snap => (snap?.data() as { plan?: PlanTier } | undefined)?.plan ?? 'starter'),
          distinctUntilChanged(),
        ),
    { initialValue: this.bypassGating ? 'agency_internal' : 'starter' },
  );

  readonly billingRecord: Signal<BillingRecord | null> = toSignal(
    this.bypassGating
      ? of(null)
      : this.snapshot$.pipe(
          map(snap => (snap?.exists() ? (snap.data() as BillingRecord) : null)),
          distinctUntilChanged(),
        ),
    { initialValue: null },
  );

  readonly features: Signal<TenantFeatures> = computed(() => TIER_FEATURES[this.plan()]);

  hasPlatformFeature(feature: keyof PlatformFeatures): Signal<boolean> {
    return computed(() => this.features().platform[feature]);
  }

  hasPageType(type: PageType): Signal<boolean> {
    return computed(() => this.features().unlockedPageTypes.includes(type));
  }
}
