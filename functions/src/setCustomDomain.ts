import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ADMIN_ALLOWED_ORIGINS } from './shared-constants';
import { featuresForPlan } from './plan-features';

if (!getApps().length) initializeApp();

const CNAME_TARGET = 'foliokit-blog--foliokit-6f974.us-central1.hosted.app';
const DOMAIN_RE = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;

export const setCustomDomain = onRequest({ cors: ADMIN_ALLOWED_ORIGINS }, async (req, res) => {
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
    const { tenantId, domain } = req.body ?? {};
    if (!tenantId || typeof tenantId !== 'string') {
      res.status(400).json({ error: 'invalid_tenant_id' });
      return;
    }
    if (!domain || typeof domain !== 'string') {
      res.status(400).json({ error: 'invalid_domain' });
      return;
    }

    // Normalize: strip protocol and trailing slashes
    const normalizedDomain = domain
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/, '');

    if (normalizedDomain.length > 253) {
      res.status(400).json({ error: 'invalid_domain' });
      return;
    }
    if (!DOMAIN_RE.test(normalizedDomain)) {
      res.status(400).json({ error: 'invalid_domain' });
      return;
    }
    if (
      normalizedDomain.endsWith('.foliokitcms.com') ||
      normalizedDomain.endsWith('.firebaseapp.com') ||
      normalizedDomain.endsWith('.web.app')
    ) {
      res.status(400).json({ error: 'reserved_domain' });
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

    // --- Authorization check ---
    if (decodedToken.email !== tenantData.ownerEmail) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // --- Plan gate ---
    const billingSnap = await db.doc(`billing/${tenantId}`).get();
    const billingData = billingSnap.data() as { plan?: string } | undefined;
    const features = featuresForPlan(billingData?.plan);
    if (!features.platform.customDomain) {
      res.status(403).json({ error: 'plan_upgrade_required' });
      return;
    }

    // --- Persist ---
    await db.doc(`tenants/${tenantId}`).update({
      customDomain: normalizedDomain,
      customDomainStatus: 'pending_dns',
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      domain: normalizedDomain,
      cname: {
        type: 'CNAME',
        name: 'www',
        value: CNAME_TARGET,
      },
      apexNote:
        'Many DNS providers do not support CNAME records on the apex domain (@). Use www and redirect your apex to www, or use a DNS provider that supports CNAME flattening (e.g. Cloudflare).',
      nextStep:
        'After setting DNS records, use the verify endpoint to check propagation status.',
    });
  } catch (err) {
    logger.error('setCustomDomain: unexpected error', { error: err });
    res.status(500).json({ error: 'internal' });
  }
});
