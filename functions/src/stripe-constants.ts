// TODO: Fill in your real Stripe Price IDs before going live.
// Find them in the Stripe Dashboard → Products → your plan → Pricing.
export const PRICE_IDS: Record<'pro' | 'agency', string> = {
  pro: 'price_1THQxnFzZbJgjuvrT4HVE0ui',
  agency: 'price_1THQyEFzZbJgjuvr328S5y0n',
};

export function resolvePlanFromPriceId(priceId: string): 'pro' | 'agency' | null {
  const entry = Object.entries(PRICE_IDS).find(([, id]) => id === priceId);
  return entry ? (entry[0] as 'pro' | 'agency') : null;
}
