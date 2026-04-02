import type { PlanTier } from './billing-record.model';

export interface PlanFeatures {
  customDomain: boolean;
  removeBranding: boolean;
}

export function getPlanFeatures(plan: PlanTier): PlanFeatures {
  switch (plan) {
    case 'pro':
    case 'agency':
      return { customDomain: true, removeBranding: true };
    case 'starter':
    default:
      return { customDomain: false, removeBranding: false };
  }
}
