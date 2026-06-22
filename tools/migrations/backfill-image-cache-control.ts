/**
 * One-time backfill: set `Cache-Control: public, max-age=31536000, immutable`
 * on existing Firebase Storage image objects.
 *
 * Background: images uploaded before the admin upload pipeline started sending
 * `cacheControl` metadata inherited Firebase Storage's default
 * `Cache-Control: private, max-age=0`. Social-card crawlers (X/Twitter,
 * Facebook) refuse to cache/display `private` origin images, so blog cover
 * images never rendered as link thumbnails. New uploads are fixed at the four
 * call sites (see IMAGE_UPLOAD_METADATA in cms-admin-ui); this script repairs
 * the images already in the bucket.
 *
 * Scope: every object whose contentType is `image/*` (covers post covers,
 * embedded post media, author photos, and site-profile avatars regardless of
 * path) that is not already served with a `public` cache.
 *
 * Prerequisites:
 *   1. Download a service account key from Firebase Console >
 *      Project Settings > Service Accounts > Generate new private key
 *   2. Save it outside the repo (e.g. ~/.config/foliokit/service-account.json)
 *   3. Export the path:
 *        export GOOGLE_APPLICATION_CREDENTIALS=~/.config/foliokit/service-account.json
 *   4. Dry-run first (lists what would change, writes nothing):
 *        npx ts-node --project tools/migrations/tsconfig.migration.json \
 *          tools/migrations/backfill-image-cache-control.ts
 *   5. Apply:
 *        npx ts-node --project tools/migrations/tsconfig.migration.json \
 *          tools/migrations/backfill-image-cache-control.ts --apply
 *
 * Safe to re-run — objects already public are skipped. After running, re-scrape
 * affected URLs with the Facebook Sharing Debugger / X card validator to bust
 * the crawlers' cache. Discard this file once confirmed in production.
 */

import * as admin from 'firebase-admin';

const STORAGE_BUCKET = 'foliokit-6f974.firebasestorage.app';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const APPLY = process.argv.includes('--apply');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'foliokit-6f974',
    storageBucket: STORAGE_BUCKET,
  });
}

async function backfill(): Promise<void> {
  const mode = APPLY ? 'APPLY' : 'DRY-RUN';
  console.log(`[backfill] mode=${mode} bucket=${STORAGE_BUCKET}`);

  const bucket = admin.storage().bucket();
  const [files] = await bucket.getFiles();

  let images = 0;
  let updated = 0;
  let alreadyPublic = 0;

  for (const file of files) {
    const [metadata] = await file.getMetadata();
    const contentType = metadata.contentType ?? '';
    if (!contentType.startsWith('image/')) continue;
    images++;

    const current = metadata.cacheControl ?? '';
    if (current.includes('public')) {
      alreadyPublic++;
      continue;
    }

    console.log(
      `[backfill] ${file.name} — cacheControl: "${current || '(none)'}" -> "${CACHE_CONTROL}"`,
    );
    if (APPLY) {
      await file.setMetadata({ cacheControl: CACHE_CONTROL });
      updated++;
    }
  }

  console.log(
    `[backfill] images=${images} alreadyPublic=${alreadyPublic} ` +
      `${APPLY ? `updated=${updated}` : `wouldUpdate=${images - alreadyPublic}`}`,
  );
  if (!APPLY) {
    console.log('[backfill] DRY-RUN only — re-run with --apply to write changes.');
  }
}

backfill().catch((err) => {
  console.error('[backfill] Error:', err);
  process.exit(1);
});
