export type PlanTier = 'starter' | 'pro' | 'agency' | 'agency_internal';
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled';
export interface BillingRecord {
  tenantId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  plan: PlanTier;
  status: BillingStatus;
  trialEndsAt: import('@firebase/firestore').Timestamp | null;
  currentPeriodEndsAt: import('@firebase/firestore').Timestamp;
}
