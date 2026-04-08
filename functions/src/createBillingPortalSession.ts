import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ADMIN_ALLOWED_ORIGINS } from './shared-constants';
import { stripeSecretKey, getStripeClient } from './stripeClient';

if (!getApps().length) initializeApp();

export const createBillingPortalSession = onRequest(
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
      const { tenantId } = req.body ?? {};
      if (!tenantId || typeof tenantId !== 'string') {
        res.status(400).json({ error: 'invalid_request' });
        return;
      }

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

      // --- Load billing record ---
      const billingSnap = await db.doc(`billing/${tenantId}`).get();
      const billingData = billingSnap.data() as { stripeCustomerId?: string } | undefined;
      const stripeCustomerId = billingData?.stripeCustomerId ?? '';
      if (!stripeCustomerId) {
        res.status(400).json({ error: 'no_stripe_customer' });
        return;
      }

      // --- Create billing portal session ---
      const stripe = getStripeClient();
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: 'https://admin.foliokitcms.com/settings',
      });

      res.status(200).json({ url: session.url });
    } catch (err) {
      logger.error('createBillingPortalSession: unexpected error', { error: err });
      res.status(500).json({ error: 'internal' });
    }
  }
);
