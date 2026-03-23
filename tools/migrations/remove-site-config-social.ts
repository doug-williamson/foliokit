/**
 * One-time migration: remove the orphaned `social` field from all
 * /site-config/{siteId} documents in Firestore.
 *
 * Background: `SiteConfig.social` has been removed from the data model.
 * Social links now live exclusively on `pages.about.socialLinks`.
 * Existing documents written before this change still contain the field;
 * this script deletes it for hygiene.
 *
 * Prerequisites:
 *   1. Download a service account key from Firebase Console >
 *      Project Settings > Service Accounts > Generate new private key
 *   2. Save it outside the repo (e.g. ~/.config/foliokit/service-account.json)
 *   3. Export the path:
 *        export GOOGLE_APPLICATION_CREDENTIALS=~/.config/foliokit/service-account.json
 *   4. Run:
 *        npx ts-node --project tools/migrations/tsconfig.migration.json \
 *          tools/migrations/remove-site-config-social.ts
 *
 * This script is safe to re-run — deleting a non-existent field is a no-op.
 * Discard this file once the migration has been confirmed in production.
 */

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'foliokit-6f974',
  });
}

const db = admin.firestore();

async function migrate(): Promise<void> {
  console.log('[migration] Scanning /site-config collection…');

  const snapshot = await db.collection('site-config').get();

  if (snapshot.empty) {
    console.log('[migration] No documents found. Nothing to do.');
    return;
  }

  const batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if ('social' in data) {
      console.log(`[migration] Removing social field from site-config/${doc.id}`);
      batch.update(doc.ref, { social: admin.firestore.FieldValue.delete() });
      count++;
    } else {
      console.log(`[migration] site-config/${doc.id} — social field already absent, skipping`);
    }
  }

  if (count === 0) {
    console.log('[migration] All documents already clean. Nothing to write.');
    return;
  }

  await batch.commit();
  console.log(`[migration] Done. Removed social field from ${count} document(s).`);
}

migrate().catch((err) => {
  console.error('[migration] Error:', err);
  process.exit(1);
});
