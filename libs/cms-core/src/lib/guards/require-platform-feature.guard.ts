import { computed, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { PlatformFeatures } from '../models/plan-features.model';
import { PlanGatingService } from '../services/plan-gating.service';

/**
 * @deprecated — route-level plan gating deferred to Phase 15. Use PlanGateComponent for soft-block UI instead.
 */
export function requirePlatformFeature(feature: keyof PlatformFeatures): CanActivateFn {
  return () => {
    const gating = inject(PlanGatingService);
    const router = inject(Router);
    return computed(() =>
      gating.features().platform[feature]
        ? true
        : router.createUrlTree(['/settings'], { queryParams: { upgrade: feature } })
    )();
  };
}
