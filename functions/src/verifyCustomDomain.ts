import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ADMIN_ALLOWED_ORIGINS } from './shared-constants';
import * as dns from 'node:dns/promises';

if (!getApps().length) initializeApp();

const CNAME_TARGET = 'foliokit-blog--foliokit-6f974.us-central1.hosted.app';

export const verifyCustomDomain = onRequest(async (req, res) => {
  // CORS
  const origin = req.headers.origin ?? '';
  if (ADMIN_ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
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

    // --- Query param validation ---
    const tenantId = req.query['tenantId'];
    if (!tenantId || typeof tenantId !== 'string') {
      res.status(400).json({ error: 'invalid_tenant_id' });
      return;
    }

    // --- Load tenant ---
    const db = getFirestore();
    const tenantSnap = await db.doc(`tenants/${tenantId}`).get();
    if (!tenantSnap.exists) {
      res.status(404).json({ error: 'tenant_not_found' });
      return;
    }
    const tenantData = tenantSnap.data() as { ownerEmail: string; customDomain?: string | null };

    // --- Authorization check ---
    if (decodedToken.email !== tenantData.ownerEmail) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // --- Plan gate ---
    const billingSnap = await db.doc(`billing/${tenantId}`).get();
    const billingData = billingSnap.data() as { plan?: string } | undefined;
    if (billingData?.plan === 'starter') {
      res.status(403).json({ error: 'plan_upgrade_required' });
      return;
    }

    // --- Check domain is set ---
    const customDomain = tenantData.customDomain;
    if (!customDomain) {
      res.status(400).json({ error: 'no_custom_domain_configured' });
      return;
    }

    // --- DNS verification ---
    // Try both the domain as-is and with www. prefix, in case tenant entered the apex.
    const lookups = await Promise.allSettled([
      dns.resolveCname(customDomain),
      dns.resolveCname('www.' + customDomain),
    ]);

    const resolved: string[] = [];
    for (const result of lookups) {
      if (result.status === 'fulfilled') {
        resolved.push(...result.value);
      }
    }

    if (resolved.length > 0) {
      const verified = resolved.some((r) => r.includes('hosted.app'));
      if (verified) {
        res.status(200).json({ status: 'verified', domain: customDomain });
      } else {
        res.status(200).json({
          status: 'wrong_target',
          domain: customDomain,
          expected: CNAME_TARGET,
        });
      }
      return;
    }

    // All lookups failed — check error codes
    const errors = lookups
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r) => r.reason as NodeJS.ErrnoException);

    const isPropagationError = errors.every(
      (e) => e.code === 'ENOTFOUND' || e.code === 'ENODATA'
    );

    if (isPropagationError) {
      res.status(200).json({
        status: 'pending',
        domain: customDomain,
        message: 'DNS records not yet propagated. This can take up to 48 hours.',
      });
    } else {
      res.status(200).json({
        status: 'error',
        domain: customDomain,
        message: 'Could not verify DNS records.',
      });
    }
  } catch (err) {
    logger.error('verifyCustomDomain: unexpected error', { error: err });
    res.status(500).json({ error: 'internal' });
  }
});
