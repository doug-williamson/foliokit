/**
 * One-time migration: copy root-level Firestore collections into tenants/{tenantId}/
 *
 * Background: FolioKit's multi-tenancy scopes all data under tenants/{tenantId}/.
 * This script copies root-level documents (posts, authors, tags, pages,
 * site-config) into the tenant path so the root collections can be retired.
 *
 * Collections migrated:
 *   /posts/*           → tenants/{tenantId}/posts/*
 *   /authors/*         → tenants/{tenantId}/authors/*
 *   /tags/*            → tenants/{tenantId}/tags/*
 *   /pages/*           → tenants/{tenantId}/pages/*
 *   /site-config/*     → tenants/{tenantId}/site-config/*
 *
 * Special handling:
 *   /site-config/default → tenants/{tenantId}/site-config/{tenantId}
 *   (doc ID remapped from 'default' to the tenant ID)
 *
 * The script also creates (or overwrites) the tenant registry document at
 * tenants/{tenantId} with ownerEmail so Firestore rules can resolve
 * isTenantOwner().
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
 *     tools/migrations/migrate-root-to-tenant.ts --project emulator --dry-run
 *
 *   # Live run against emulator
 *   npx ts-node --project tools/migrations/tsconfig.migration.json \
 *     tools/migrations/migrate-root-to-tenant.ts --project emulator --tenant foliokit
 *
 *   # Live run against production with delete
 *   npx ts-node --project tools/migrations/tsconfig.migration.json \
 *     tools/migrations/migrate-root-to-tenant.ts --project prod --tenant foliokit --delete-originals
 *
 * This script is safe to re-run — set() on an existing document is a harmless
 * overwrite, and deleting a non-existent document is a Firestore no-op.
 */

import * as admin from 'firebase-admin';

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name: string): string | null {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] ?? null : null;
}

const project = getArg('project');
const tenantId = getArg('tenant') ?? 'foliokit';
const dryRun = args.includes('--dry-run');
const deleteOriginals = args.includes('--delete-originals');

if (project !== 'emulator' && project !== 'prod') {
  console.error('Error: --project emulator|prod is required.');
  console.error('');
  console.error('Usage:');
  console.error('  npx ts-node --project tools/migrations/tsconfig.migration.json \\');
  console.error('    tools/migrations/migrate-root-to-tenant.ts --project emulator|prod [--tenant <id>] [--dry-run] [--delete-originals]');
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

const COLLECTIONS = ['posts', 'authors', 'tags', 'pages'] as const;
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
  const target = project === 'prod' ? 'foliokit-6f974 (production)' : 'foliokit-6f974 (emulator)';
  console.log(`${tag} Target: ${target}`);
  console.log(`${tag} Tenant: ${tenantId}`);
  console.log(`${tag} Delete originals: ${deleteOriginals}`);
  console.log('');

  let totalCopied = 0;
  let totalDeleted = 0;

  // ── Regular collections ───────────────────────────────────────────────────

  for (const collectionName of COLLECTIONS) {
    const sourceCol = db.collection(collectionName);
    const targetCol = db.collection(`tenants/${tenantId}/${collectionName}`);

    const snapshot = await sourceCol.get();

    if (snapshot.empty) {
      console.log(`${tag} /${collectionName} — empty, skipping`);
      continue;
    }

    // Copy phase
    console.log(`${tag} Copying ${snapshot.size} doc(s): /${collectionName} → tenants/${tenantId}/${collectionName}`);

    let copyBatch = db.batch();
    let copyCount = 0;

    for (const sourceDoc of snapshot.docs) {
      const targetRef = targetCol.doc(sourceDoc.id);
      console.log(`${tag}   copy  /${collectionName}/${sourceDoc.id} → tenants/${tenantId}/${collectionName}/${sourceDoc.id}`);

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

    // Delete phase (only if --delete-originals)
    if (deleteOriginals) {
      let deleteBatch = db.batch();
      let deleteCount = 0;

      for (const sourceDoc of snapshot.docs) {
        console.log(`${tag}   delete /${collectionName}/${sourceDoc.id}`);

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
  }

  // ── site-config (special: remap 'default' doc ID → tenantId) ─────────────

  const siteConfigCol = db.collection('site-config');
  const siteConfigSnapshot = await siteConfigCol.get();

  if (!siteConfigSnapshot.empty) {
    console.log(`${tag} Copying ${siteConfigSnapshot.size} doc(s): /site-config → tenants/${tenantId}/site-config`);

    let copyBatch = db.batch();
    let copyCount = 0;

    for (const sourceDoc of siteConfigSnapshot.docs) {
      // Remap 'default' to the tenant ID; keep other doc IDs as-is
      const targetDocId = sourceDoc.id === 'default' ? tenantId : sourceDoc.id;
      const targetRef = db.doc(`tenants/${tenantId}/site-config/${targetDocId}`);

      const data = sourceDoc.data();
      // Update the id field to match the new doc ID
      if (sourceDoc.id === 'default') {
        data['id'] = tenantId;
      }

      console.log(`${tag}   copy  /site-config/${sourceDoc.id} → tenants/${tenantId}/site-config/${targetDocId}`);

      if (!dryRun) {
        copyBatch.set(targetRef, data);
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

    if (deleteOriginals) {
      let deleteBatch = db.batch();
      let deleteCount = 0;

      for (const sourceDoc of siteConfigSnapshot.docs) {
        console.log(`${tag}   delete /site-config/${sourceDoc.id}`);

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
  } else {
    console.log(`${tag} /site-config — empty, skipping`);
  }

  // ── Tenant registry document ──────────────────────────────────────────────

  console.log(`${tag} Writing tenant registry doc: tenants/${tenantId}`);
  if (!dryRun) {
    await db.doc(`tenants/${tenantId}`).set(
      {
        tenantId,
        ownerEmail: 'dev.foliokit@gmail.com',
        subdomain: tenantId,
        customDomain: null,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true },
    );
  }

  console.log('');
  console.log(`${tag} Done.`);
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
