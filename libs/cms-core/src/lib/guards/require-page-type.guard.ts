import { computed, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { PageType } from '../models/plan-features.model';
import { PlanGatingService } from '../services/plan-gating.service';

export function requirePageType(type: PageType): CanActivateFn {
  return () => {
    const gating = inject(PlanGatingService);
    const router = inject(Router);
    return computed(() =>
      gating.features().unlockedPageTypes.includes(type)
        ? true
        : router.createUrlTree(['/settings'], { queryParams: { upgrade: type } })
    )();
  };
}
