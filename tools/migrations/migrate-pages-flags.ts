/**
 * One-time migration: promote the flat `pages.aboutEnabled` / `pages.linksEnabled`
 * flags into the nested shape `pages.about.enabled` / `pages.links.enabled`.
 *
 * Background: the old `SiteConfigService.saveSiteConfig` merged the `features`
 * object into `pages` when writing to Firestore, so the live document stores
 * the flags as `pages.aboutEnabled` and `pages.linksEnabled` rather than at a
 * top-level `features` key.  This migration moves them to their new location
 * and removes the old flat flags.
 *
 * Prerequisites:
 *   1. Download a service account key from Firebase Console >
 *      Project Settings > Service Accounts > Generate new private key
 *   2. Save it outside the repo (e.g. ~/.config/foliokit/service-account.json)
 *   3. Export the path:
 *        export GOOGLE_APPLICATION_CREDENTIALS=~/.config/foliokit/service-account.json
 *   4. Run against dev first to verify:
 *        npx ts-node --project tools/migrations/tsconfig.migration.json \
 *          tools/migrations/migrate-pages-flags.ts
 *
 * This script is safe to re-run — writing the same value twice is a no-op,
 * and deleting a non-existent field is silently ignored by Firestore.
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

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as Record<string, unknown>;
    const pages = (data['pages'] ?? {}) as Record<string, unknown>;

    const hasAboutFlag = 'aboutEnabled' in pages;
    const hasLinksFlag = 'linksEnabled' in pages;

    if (!hasAboutFlag && !hasLinksFlag) {
      console.log(`[migration] site-config/${docSnap.id} — flags already absent, skipping`);
      continue;
    }

    const about = ((pages['about'] ?? {}) as Record<string, unknown>);
    const links = ((pages['links'] ?? {}) as Record<string, unknown>);

    const update: Record<string, unknown> = {};

    if (hasAboutFlag) {
      const aboutEnabled = pages['aboutEnabled'] as boolean;
      update['pages.about'] = { ...about, enabled: aboutEnabled };
      update['pages.aboutEnabled'] = admin.firestore.FieldValue.delete();
      console.log(`[migration] site-config/${docSnap.id} — pages.aboutEnabled (${aboutEnabled}) → pages.about.enabled`);
    }

    if (hasLinksFlag) {
      const linksEnabled = pages['linksEnabled'] as boolean;
      update['pages.links'] = { ...links, enabled: linksEnabled };
      update['pages.linksEnabled'] = admin.firestore.FieldValue.delete();
      console.log(`[migration] site-config/${docSnap.id} — pages.linksEnabled (${linksEnabled}) → pages.links.enabled`);
    }

    try {
      await docSnap.ref.update(update);
      console.log(`[migration] site-config/${docSnap.id} — updated successfully`);
    } catch (err) {
      console.error(`[migration] site-config/${docSnap.id} — update failed:`, err);
    }
  }

  console.log('[migration] Done.');
}

migrate().catch((err) => {
  console.error('[migration] Fatal error:', err);
  process.exit(1);
});
