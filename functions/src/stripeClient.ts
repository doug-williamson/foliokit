import { defineSecret } from 'firebase-functions/params';
import Stripe from 'stripe';

export const stripeSecretKey = defineSecret('stripe-secret-key');
export const stripeWebhookSecret = defineSecret('stripe-webhook-secret');

export function getStripeClient(): Stripe {
  return new Stripe(stripeSecretKey.value(), {
    apiVersion: '2025-02-24.acacia',
  });
}
