// TODO: Fill in your real Stripe Price IDs before going live.
// Find them in the Stripe Dashboard → Products → your plan → Pricing.
// When running on the Functions emulator, use test price IDs (matches apps/admin environment.ts).
const IS_EMULATOR = process.env['FUNCTIONS_EMULATOR'] === 'true';

export const PRICE_IDS: Record<'pro' | 'agency', string> = {
  pro: IS_EMULATOR ? 'price_1TL8t7FzZbJgjuvrSyjDcElg' : 'price_1THQxnFzZbJgjuvrT4HVE0ui',
  agency: IS_EMULATOR ? 'price_1TL8tLFzZbJgjuvrUC3w7g3M' : 'price_1THQyEFzZbJgjuvr328S5y0n',
};

export function resolvePlanFromPriceId(priceId: string): 'pro' | 'agency' | null {
  const entry = Object.entries(PRICE_IDS).find(([, id]) => id === priceId);
  return entry ? (entry[0] as 'pro' | 'agency') : null;
}
