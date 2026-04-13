import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ALLOWED_ORIGINS, RESERVED_SUBDOMAINS, EMAIL_RE, SUBDOMAIN_RE } from './shared-constants';

if (!getApps().length) initializeApp();

export const provisionTenant = onRequest(async (req, res) => {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const { email, subdomain, displayName } = req.body ?? {};

    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
      res.status(400).json({ error: 'invalid_email' });
      return;
    }
    if (!subdomain || typeof subdomain !== 'string' || !SUBDOMAIN_RE.test(subdomain)) {
      res.status(400).json({ error: 'invalid_subdomain' });
      return;
    }
    if (!displayName || typeof displayName !== 'string' || displayName.length > 80) {
      res.status(400).json({ error: 'invalid_display_name' });
      return;
    }

    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      res.status(400).json({ error: 'subdomain_reserved' });
      return;
    }

    const db = getFirestore();

    // Uniqueness check
    const existing = await db.collection('tenants').where('subdomain', '==', subdomain).get();
    if (!existing.empty) {
      res.status(409).json({ error: 'subdomain_taken' });
      return;
    }

    const tenantId = subdomain;
    const blogUrl = `https://${subdomain}.foliokitcms.com`;
    const batch = db.batch();

    // Write 1 — /tenants/{tenantId}
    batch.set(db.doc(`tenants/${tenantId}`), {
      tenantId,
      subdomain,
      customDomain: null,
      ownerEmail: email,
      displayName,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Write 2 — /tenants/{tenantId}/site-config/{tenantId}
    batch.set(db.doc(`tenants/${tenantId}/site-config/${tenantId}`), {
      id: tenantId,
      siteName: displayName,
      siteUrl: blogUrl,
      description: '',
      nav: [
        { label: 'Home', url: '/', order: 0 },
        { label: 'Blog', url: '/posts', order: 1 },
        { label: 'About', url: '/about', order: 2 },
        { label: 'Links', url: '/links', order: 3 },
      ],
      pages: {
        home: {
          enabled: true,
          heroHeadline: `Hey, I'm ${displayName}`,
          heroSubheadline: '',
          ctaLabel: 'Read Posts',
          ctaUrl: '/posts',
          showRecentPosts: true,
        },
        about: { enabled: false, headline: displayName, bio: '' },
        links: { enabled: false },
      },
      updatedAt: Date.now(),
    });

    // Write 3 — /billing/{tenantId}
    const trialEnd = Timestamp.fromMillis(Date.now() + 14 * 24 * 60 * 60 * 1000);
    batch.set(db.doc(`billing/${tenantId}`), {
      tenantId,
      stripeCustomerId: '',
      stripePriceId: '',
      plan: 'starter',
      status: 'trialing',
      trialEndsAt: trialEnd,
      currentPeriodEndsAt: trialEnd,
    });

    await batch.commit();

    // TODO: Wire up email transport (nodemailer or similar) to actually send the magic link.
    // For now the link is logged to Cloud Logging so it can be manually sent during early testing.
    try {
      const auth = getAuth();
      const actionCodeSettings = {
        url: `https://admin.foliokitcms.com?tenantId=${tenantId}`,
        handleCodeInApp: true,
      };
      const magicLink = await auth.generateSignInWithEmailLink(email, actionCodeSettings);
      logger.info('provisionTenant: magic link generated', { tenantId, email, magicLink });
    } catch (emailErr) {
      logger.error('provisionTenant: failed to generate magic link', { tenantId, email, error: emailErr });
    }

    res.status(200).json({ tenantId, blogUrl });
  } catch (err) {
    logger.error('provisionTenant: unexpected error', { error: err });
    res.status(500).json({ error: 'internal' });
  }
});
