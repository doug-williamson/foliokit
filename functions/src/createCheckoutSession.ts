import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ADMIN_ALLOWED_ORIGINS } from './shared-constants';
import { stripeSecretKey, getStripeClient } from './stripeClient';
import { PRICE_IDS } from './stripe-constants';

if (!getApps().length) initializeApp();

export const createCheckoutSession = onRequest(
  { secrets: [stripeSecretKey], cors: ADMIN_ALLOWED_ORIGINS },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method_not_allowed' });
      return;
    }

    try {
      // --- Auth ---
      const authHeader = req.headers.authorization ?? '';
      if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'unauthenticated' });
        return;
      }
      const idToken = authHeader.slice(7);
      let decodedToken: { email?: string };
      try {
        decodedToken = await getAuth().verifyIdToken(idToken);
      } catch {
        res.status(401).json({ error: 'unauthenticated' });
        return;
      }

      // --- Body validation ---
      const { tenantId, plan } = req.body ?? {};
      if (!tenantId || typeof tenantId !== 'string') {
        res.status(400).json({ error: 'invalid_tenant_id' });
        return;
      }
      if (plan === 'starter') {
        res.status(400).json({ error: 'invalid_plan' });
        return;
      }
      if (plan !== 'pro' && plan !== 'agency') {
        res.status(400).json({ error: 'invalid_plan' });
        return;
      }
      const validPlan = plan as 'pro' | 'agency';

      // --- Load tenant ---
      const db = getFirestore();
      const tenantSnap = await db.doc(`tenants/${tenantId}`).get();
      if (!tenantSnap.exists) {
        res.status(404).json({ error: 'tenant_not_found' });
        return;
      }
      const tenantData = tenantSnap.data() as { ownerEmail: string };
      const ownerEmail = tenantData.ownerEmail;

      // --- Authorization check ---
      if (decodedToken.email !== ownerEmail) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }

      // --- Stripe customer resolution ---
      const stripe = getStripeClient();
      const billingRef = db.doc(`billing/${tenantId}`);
      const billingSnap = await billingRef.get();
      const billingData = billingSnap.data() as { stripeCustomerId?: string } | undefined;

      let stripeCustomerId = billingData?.stripeCustomerId ?? '';
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: ownerEmail,
          metadata: { tenantId },
        });
        stripeCustomerId = customer.id;
        await billingRef.update({ stripeCustomerId });
      }

      // --- Create Checkout Session ---
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        line_items: [{ price: PRICE_IDS[validPlan], quantity: 1 }],
        success_url: `https://admin.foliokitcms.com/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://admin.foliokitcms.com/billing?canceled=true`,
        subscription_data: {
          metadata: { tenantId },
        },
        metadata: { tenantId },
      });

      res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (err) {
      logger.error('createCheckoutSession: unexpected error', { error: err });
      res.status(500).json({ error: 'internal' });
    }
  }
);
