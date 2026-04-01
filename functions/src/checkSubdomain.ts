import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { ALLOWED_ORIGINS, RESERVED_SUBDOMAINS, SUBDOMAIN_RE } from './shared-constants';

if (!getApps().length) initializeApp();

export const checkSubdomain = onRequest(async (req, res) => {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    const subdomain = req.query.subdomain as string | undefined;

    if (!subdomain || typeof subdomain !== 'string') {
      res.status(400).json({ error: 'missing_subdomain' });
      return;
    }

    if (!SUBDOMAIN_RE.test(subdomain)) {
      res.status(200).json({ available: false, reason: 'invalid_format' });
      return;
    }

    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      res.status(200).json({ available: false, reason: 'reserved' });
      return;
    }

    const db = getFirestore();
    const existing = await db.collection('tenants').where('subdomain', '==', subdomain).get();

    if (!existing.empty) {
      res.status(200).json({ available: false, reason: 'taken' });
      return;
    }

    res.status(200).json({ available: true });
  } catch (err) {
    logger.error('checkSubdomain: unexpected error', { error: err });
    res.status(500).json({ error: 'internal' });
  }
});
