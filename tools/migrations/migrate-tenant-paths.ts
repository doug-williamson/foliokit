/**
 * One-time migration: rename Firestore path prefix sites/{tenantId}/ → tenants/{tenantId}/
 *
 * Background: Phase 11a renames the multi-tenant Firestore path convention from
 * sites/{tenantId}/ to tenants/{tenantId}/. This script copies all documents from
 * the old paths to the new paths and deletes the originals.
 *
 * Collections migrated (per tenant found under /sites):
 *   sites/{tenantId}/posts        → tenants/{tenantId}/posts
 *   sites/{tenantId}/authors      → tenants/{tenantId}/authors
 *   sites/{tenantId}/tags         → tenants/{tenantId}/tags
 *   sites/{tenantId}/site-config  → tenants/{tenantId}/site-config
 *
 * Root-level single-tenant collections (posts, authors, tags, site-config)
 * are NOT touched by this script.
 *
 * Prerequisites:
 *   - Production: download a service account key from Firebase Console >
 *     Project Settings > Service Accounts > Generate new private key,
 *     save it outside the repo, then:
 *       export GOOGLE_APPLICATION_CREDENTIALS=~/.config/foliokit/service-account.json
 *   - Emulator: start the emulator suite first (npm run emulator)
 *
 * Usage:
 *   # Dry-run against emulator (no writes)
 *   npx ts-node --project tools/migrations/tsconfig.migration.json \
 *     tools/migrations/migrate-tenant-paths.ts --project emulator --dry-run
 *
 *   # Live run against emulator
 *   npx ts-node --project tools/migrations/tsconfig.migration.json \
 *     tools/migrations/migrate-tenant-paths.ts --project emulator
 *
 *   # Live run against production
 *   npx ts-node --project tools/migrations/tsconfig.migration.json \
 *     tools/migrations/migrate-tenant-paths.ts --project prod
 *
 * This script is safe to re-run — set() on an existing document is a harmless
 * overwrite, and deleting a non-existent document is a Firestore no-op.
 * Discard this file once the migration has been confirmed in production.
 */

import * as admin from 'firebase-admin';

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const projectArgIndex = args.indexOf('--project');
const project = projectArgIndex !== -1 ? args[projectArgIndex + 1] : null;
const dryRun = args.includes('--dry-run');

if (project !== 'emulator' && project !== 'prod') {
  console.error('Error: --project emulator|prod is required.');
  console.error('');
  console.error('Usage:');
  console.error('  npx ts-node --project tools/migrations/tsconfig.migration.json \\');
  console.error('    tools/migrations/migrate-tenant-paths.ts --project emulator|prod [--dry-run]');
  process.exit(1);
}

// Must be set before initializeApp() to redirect Admin SDK traffic to the emulator.
if (project === 'emulator') {
  process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
}

// ── Firebase init ─────────────────────────────────────────────────────────────

if (!admin.apps.length) {
  admin.initializeApp(
    project === 'prod'
      ? { credential: admin.credential.applicationDefault(), projectId: 'foliokit-6f974' }
      : { projectId: 'foliokit-6f974' },
  );
}

const db = admin.firestore();

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBCOLLECTIONS = ['posts', 'authors', 'tags', 'site-config'] as const;
const BATCH_LIMIT = 499; // Firestore max is 500 ops per batch

// ── Helpers ───────────────────────────────────────────────────────────────────

async function flushBatch(
  batch: admin.firestore.WriteBatch,
  count: number,
): Promise<void> {
  if (dryRun || count === 0) return;
  await batch.commit();
}

// ── Migration ─────────────────────────────────────────────────────────────────

async function migrate(): Promise<void> {
  const tag = dryRun ? '[migration:dry-run]' : '[migration]';
  console.log(`${tag} Target: ${project === 'prod' ? 'foliokit-6f974 (production)' : 'foliokit-6f974 (emulator)'}`);
  console.log(`${tag} Scanning /sites collection for tenant documents…`);

  const sitesSnapshot = await db.collection('sites').get();

  if (sitesSnapshot.empty) {
    console.log(`${tag} No documents found under /sites. Nothing to migrate.`);
    return;
  }

  let totalCopied = 0;
  let totalDeleted = 0;

  for (const tenantDoc of sitesSnapshot.docs) {
    const tenantId = tenantDoc.id;
    console.log(`${tag} Tenant: ${tenantId}`);

    for (const collectionName of SUBCOLLECTIONS) {
      const sourceCol = db.collection(`sites/${tenantId}/${collectionName}`);
      const targetCol = db.collection(`tenants/${tenantId}/${collectionName}`);

      const snapshot = await sourceCol.get();

      if (snapshot.empty) {
        console.log(`${tag}   sites/${tenantId}/${collectionName} — empty, skipping`);
        continue;
      }

      // ── Copy phase ──────────────────────────────────────────────────────────
      console.log(`${tag}   Copying ${snapshot.size} doc(s): sites/${tenantId}/${collectionName} → tenants/${tenantId}/${collectionName}`);

      let copyBatch = db.batch();
      let copyCount = 0;

      for (const sourceDoc of snapshot.docs) {
        const targetRef = targetCol.doc(sourceDoc.id);
        console.log(`${tag}     copy  sites/${tenantId}/${collectionName}/${sourceDoc.id} → tenants/${tenantId}/${collectionName}/${sourceDoc.id}`);

        if (!dryRun) {
          copyBatch.set(targetRef, sourceDoc.data());
          copyCount++;
          totalCopied++;

          if (copyCount >= BATCH_LIMIT) {
            await copyBatch.commit();
            copyBatch = db.batch();
            copyCount = 0;
          }
        } else {
          totalCopied++;
        }
      }

      await flushBatch(copyBatch, copyCount);

      // ── Delete phase ────────────────────────────────────────────────────────
      let deleteBatch = db.batch();
      let deleteCount = 0;

      for (const sourceDoc of snapshot.docs) {
        console.log(`${tag}     delete sites/${tenantId}/${collectionName}/${sourceDoc.id}`);

        if (!dryRun) {
          deleteBatch.delete(sourceDoc.ref);
          deleteCount++;
          totalDeleted++;

          if (deleteCount >= BATCH_LIMIT) {
            await deleteBatch.commit();
            deleteBatch = db.batch();
            deleteCount = 0;
          }
        } else {
          totalDeleted++;
        }
      }

      await flushBatch(deleteBatch, deleteCount);
    }

    // Delete the now-empty tenant document under /sites/{tenantId}
    console.log(`${tag}   delete sites/${tenantId} (tenant root document)`);
    if (!dryRun) {
      await tenantDoc.ref.delete();
    }
  }

  console.log('');
  console.log(`${tag} Done.`);
  console.log(`${tag}   Tenants processed : ${sitesSnapshot.size}`);
  console.log(`${tag}   Documents copied  : ${totalCopied}`);
  console.log(`${tag}   Documents deleted : ${totalDeleted}`);
  if (dryRun) {
    console.log(`${tag}   (dry-run — no writes were made)`);
  }
}

migrate().catch((err) => {
  console.error('[migration] Fatal error:', err);
  process.exit(1);
});
