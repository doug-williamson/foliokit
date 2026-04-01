import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { stripeSecretKey, stripeWebhookSecret, getStripeClient } from './stripeClient';
import { resolvePlanFromPriceId } from './stripe-constants';

if (!getApps().length) initializeApp();

export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' });
      return;
    }

    // Cloud Functions v2 preserves the unparsed body on req.rawBody.
    // Stripe signature verification MUST use the raw bytes — using the
    // parsed JSON body will cause every verification to fail.
    const rawBody = req.rawBody;
    if (!rawBody) {
      res.status(400).json({ error: 'missing_raw_body' });
      return;
    }

    const stripe = getStripeClient();
    let event: ReturnType<typeof stripe.webhooks.constructEvent>;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        req.headers['stripe-signature'] ?? '',
        stripeWebhookSecret.value()
      );
    } catch (err) {
      logger.warn('stripeWebhook: invalid signature', { error: err });
      res.status(400).json({ error: 'invalid_signature' });
      return;
    }

    const db = getFirestore();

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const tenantId = session.metadata?.tenantId;
          if (!tenantId) {
            logger.warn('stripeWebhook: checkout.session.completed missing tenantId', { sessionId: session.id });
            break;
          }
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0].price.id;
          const resolvedPlan = resolvePlanFromPriceId(priceId) ?? 'pro';
          await db.doc(`billing/${tenantId}`).update({
            stripeCustomerId: session.customer,
            stripePriceId: priceId,
            plan: resolvedPlan,
            status: 'active',
            trialEndsAt: null,
            currentPeriodEndsAt: Timestamp.fromMillis(subscription.current_period_end * 1000),
            updatedAt: FieldValue.serverTimestamp(),
          });
          logger.info('stripeWebhook: checkout completed', { tenantId, plan: resolvedPlan });
          break;
        }

        case 'customer.subscription.created': {
          // checkout.session.completed does the authoritative Firestore write after
          // checkout completes, so this event is intentionally a no-op. Log for visibility only.
          const sub = event.data.object;
          logger.info('stripeWebhook: subscription created (no-op)', {
            subscriptionId: sub.id,
            tenantId: sub.metadata?.tenantId,
          });
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const tenantId = subscription.metadata?.tenantId;
          if (!tenantId) {
            logger.warn('stripeWebhook: customer.subscription.updated missing tenantId', { subscriptionId: subscription.id });
            break;
          }
          let mappedStatus: 'trialing' | 'active' | 'past_due' | 'canceled';
          switch (subscription.status) {
            case 'active':            mappedStatus = 'active';    break;
            case 'trialing':          mappedStatus = 'trialing';  break;
            case 'past_due':          mappedStatus = 'past_due';  break;
            case 'canceled':
            case 'incomplete_expired':
            case 'unpaid':            mappedStatus = 'canceled';  break;
            default:
              logger.warn('stripeWebhook: unrecognized subscription status', {
                status: subscription.status, tenantId,
              });
              res.status(200).json({ received: true });
              return;
          }
          const priceId = subscription.items.data[0].price.id;
          const resolvedPlan = resolvePlanFromPriceId(priceId) ?? 'pro';
          await db.doc(`billing/${tenantId}`).update({
            stripePriceId: priceId,
            plan: resolvedPlan,
            status: mappedStatus,
            trialEndsAt: subscription.trial_end
              ? Timestamp.fromMillis(subscription.trial_end * 1000)
              : null,
            currentPeriodEndsAt: Timestamp.fromMillis(subscription.current_period_end * 1000),
            updatedAt: FieldValue.serverTimestamp(),
          });
          logger.info('stripeWebhook: subscription updated', { tenantId, status: mappedStatus });
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const tenantId = subscription.metadata?.tenantId;
          if (!tenantId) {
            logger.warn('stripeWebhook: customer.subscription.deleted missing tenantId', { subscriptionId: subscription.id });
            break;
          }
          // Preserve the billing doc — only mark canceled, do not delete.
          await db.doc(`billing/${tenantId}`).update({
            status: 'canceled',
            updatedAt: FieldValue.serverTimestamp(),
          });
          logger.info('stripeWebhook: subscription deleted', { tenantId });
          break;
        }

        default:
          // All other Stripe events acknowledged and ignored.
          break;
      }

      res.status(200).json({ received: true });
    } catch (err) {
      logger.error('stripeWebhook: unexpected error', { eventType: event.type, error: err });
      res.status(500).json({ error: 'internal' });
    }
  }
);
