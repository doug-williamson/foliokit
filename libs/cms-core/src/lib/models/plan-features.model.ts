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

export type PageType =
  | 'about'
  | 'links'
  | 'videoWalkthrough'
  | 'survey'
  | 'ranking'
  | 'donate'
  | 'stream';

export interface PlatformFeatures {
  customDomain: boolean;
  customCss: boolean;
  multipleAuthors: boolean;
  analytics: boolean;
  taxonomy: boolean;
}

export interface TenantFeatures {
  platform: PlatformFeatures;
  unlockedPageTypes: PageType[];
}

export const TIER_FEATURES: Record<PlanTier, TenantFeatures> = {
  starter: {
    platform: { customDomain: false, customCss: false, multipleAuthors: false, analytics: false, taxonomy: false },
    unlockedPageTypes: ['about', 'links'],
  },
  pro: {
    platform: { customDomain: true, customCss: false, multipleAuthors: false, analytics: true, taxonomy: true },
    unlockedPageTypes: ['about', 'links', 'videoWalkthrough', 'donate'],
  },
  agency: {
    platform: { customDomain: true, customCss: true, multipleAuthors: true, analytics: true, taxonomy: true },
    unlockedPageTypes: ['about', 'links', 'videoWalkthrough', 'donate', 'survey', 'ranking', 'stream'],
  },
};
