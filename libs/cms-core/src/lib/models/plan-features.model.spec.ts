import type { PlanTier } from './billing-record.model';
import { getPlanFeatures } from './plan-features.model';

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
