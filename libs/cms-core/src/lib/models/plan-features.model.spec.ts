import type { PlanTier } from './billing-record.model';
import { getPlanFeatures, TIER_FEATURES } from './plan-features.model';

describe('getPlanFeatures', () => {
  it('returns gated-off features for starter', () => {
    expect(getPlanFeatures('starter')).toEqual({
      customDomain: false,
      removeBranding: false,
    });
  });

  it('returns full features for pro', () => {
    expect(getPlanFeatures('pro')).toEqual({
      customDomain: true,
      removeBranding: true,
    });
  });

  it('returns full features for agency', () => {
    expect(getPlanFeatures('agency')).toEqual({
      customDomain: true,
      removeBranding: true,
    });
  });

  it('treats unknown plan values like starter', () => {
    expect(getPlanFeatures('unknown' as PlanTier)).toEqual({
      customDomain: false,
      removeBranding: false,
    });
  });
});

describe('TIER_FEATURES', () => {
  it('starter has no platform features enabled', () => {
    const { platform } = TIER_FEATURES['starter'];
    expect(platform.customDomain).toBe(false);
    expect(platform.customCss).toBe(false);
    expect(platform.multipleAuthors).toBe(false);
    expect(platform.analytics).toBe(false);
  });

  it('pro has customDomain and analytics', () => {
    const { platform } = TIER_FEATURES['pro'];
    expect(platform.customDomain).toBe(true);
    expect(platform.analytics).toBe(true);
    expect(platform.customCss).toBe(false);
    expect(platform.multipleAuthors).toBe(false);
  });

  it('agency has all platform features enabled', () => {
    const { platform } = TIER_FEATURES['agency'];
    expect(platform.customDomain).toBe(true);
    expect(platform.customCss).toBe(true);
    expect(platform.multipleAuthors).toBe(true);
    expect(platform.analytics).toBe(true);
  });

  it('starter unlockedPageTypes contains only about and links', () => {
    expect(TIER_FEATURES['starter'].unlockedPageTypes).toEqual(['about', 'links']);
  });

  it('pro unlockedPageTypes includes videoWalkthrough and donate', () => {
    const types = TIER_FEATURES['pro'].unlockedPageTypes;
    expect(types).toContain('videoWalkthrough');
    expect(types).toContain('donate');
    expect(types).not.toContain('survey');
    expect(types).not.toContain('stream');
  });

  it('agency unlockedPageTypes contains all page types', () => {
    const types = TIER_FEATURES['agency'].unlockedPageTypes;
    expect(types).toContain('survey');
    expect(types).toContain('ranking');
    expect(types).toContain('stream');
  });
});
