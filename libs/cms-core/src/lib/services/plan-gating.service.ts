import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { doc, DocumentData, DocumentSnapshot, onSnapshot } from 'firebase/firestore';
import { catchError, distinctUntilChanged, Observable, of, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { FIRESTORE } from '../firebase/firebase.config';
import { SITE_ID } from '../firebase/foliokit.providers';
import type { PageType, PlatformFeatures, TenantFeatures } from '../models/plan-features.model';
import { TIER_FEATURES } from '../models/plan-features.model';
import type { PlanTier } from '../models/billing-record.model';

@Injectable({ providedIn: 'root' })
export class PlanGatingService {
  private readonly firestore = inject(FIRESTORE)!;
  private readonly siteId = inject(SITE_ID, { optional: true });

  private readonly billingDoc$: Observable<PlanTier> = this.siteId
    ? new Observable<DocumentSnapshot<DocumentData>>(subscriber =>
        onSnapshot(
          doc(this.firestore, `billing/${this.siteId}`),
          snap => subscriber.next(snap),
          err => subscriber.error(err),
        )
      ).pipe(
        map(snap => (snap.data() as { plan?: PlanTier } | undefined)?.plan ?? 'starter'),
        catchError(() => of<PlanTier>('starter')),
        distinctUntilChanged(),
        shareReplay(1),
      )
    : of<PlanTier>('starter');

  readonly plan: Signal<PlanTier> = toSignal(this.billingDoc$, { initialValue: 'starter' });

  readonly features: Signal<TenantFeatures> = computed(() => TIER_FEATURES[this.plan()]);

  hasPlatformFeature(feature: keyof PlatformFeatures): Signal<boolean> {
    return computed(() => this.features().platform[feature]);
  }

  hasPageType(type: PageType): Signal<boolean> {
    return computed(() => this.features().unlockedPageTypes.includes(type));
  }
}
