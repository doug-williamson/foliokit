// SYNC NOTE: This file is a server-side mirror of
// libs/cms-core/src/lib/models/plan-features.model.ts
//
// functions/ cannot import from @foliokit/cms-core (Angular library), so this
// copy must be kept in sync manually whenever TIER_FEATURES or the type
// definitions change in the model file. When editing either file, update both.

export type PlanTier = 'starter' | 'pro' | 'agency';

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

/**
 * Returns the TenantFeatures for a given plan string.
 * Defaults to starter features when plan is undefined or an unrecognised
 * value — matches PlanGatingService's initialValue: 'starter' behaviour.
 */
export function featuresForPlan(plan: string | undefined): TenantFeatures {
  const tier = (plan ?? 'starter') as PlanTier;
  return TIER_FEATURES[tier] ?? TIER_FEATURES['starter'];
}
