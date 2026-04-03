/**
 * One-time migration: copy all data from tenants/{from}/ to tenants/{to}/
 * and create the associated billing/{to} document.
 *
 * Background: FolioKit's original blog tenant was provisioned as 'foliokit'.
 * To align with the blog URL (blog.foliokitcms.com) and the server-side
 * DEV_TENANT_ID constant, all data is being consolidated under 'foliokitcms'.
 *
 * Subcollections migrated:
 *   tenants/{from}/posts/*       → tenants/{to}/posts/*
 *   tenants/{from}/authors/*     → tenants/{to}/authors/*
 *   tenants/{from}/tags/*        → tenants/{to}/tags/*
 *   tenants/{from}/pages/*       → tenants/{to}/pages/*
 *   tenants/{from}/site-config/* → tenants/{to}/site-config/*
 *     (site-config doc ID is also remapped: {from} → {to})
 *
 * Also creates:
 *   tenants/{to}   — registry doc (copied from tenants/{from}, tenantId + subdomain updated)
 *   billing/{to}   — new billing doc with plan: 'pro', status: 'active'
 *
 * The source tenant and its billing doc are NOT deleted.
 *
 * Prerequisites:
 *   export GOOGLE_APPLICATION_CREDENTIALS=~/.config/foliokit/service-account.json
 *
 * Usage:
 *   # Dry-run (no writes)
 *   npx ts-node --project tools/migrations/tsconfig.migration.json \
 *     tools/migrations/rename-tenant.ts --project prod --from foliokit --to foliokitcms --dry-run
 *
 *   # Live run
 *   npx ts-node --project tools/migrations/tsconfig.migration.json \
 *     tools/migrations/rename-tenant.ts --project prod --from foliokit --to foliokitcms
 *
 * Safe to re-run — set() on an existing document is a harmless overwrite.
 */

import * as admin from 'firebase-admin';

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name: string): string | null {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] ?? null : null;
}

const project = getArg('project');
const fromTenant = getArg('from');
const toTenant = getArg('to');
const dryRun = args.includes('--dry-run');

if (project !== 'emulator' && project !== 'prod') {
  console.error('Error: --project emulator|prod is required.');
  process.exit(1);
}
if (!fromTenant || !toTenant) {
  console.error('Error: --from and --to are required.');
  console.error('');
  console.error('Usage:');
  console.error('  npx ts-node --project tools/migrations/tsconfig.migration.json \\');
  console.error('    tools/migrations/rename-tenant.ts --project emulator|prod --from <id> --to <id> [--dry-run]');
  process.exit(1);
}

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

const SUBCOLLECTIONS = ['posts', 'authors', 'tags', 'pages'] as const;
const BATCH_LIMIT = 499;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function copyCollection(
  fromPath: string,
  toPath: string,
  tag: string,
  idRemapFrom?: string,
  idRemapTo?: string,
): Promise<number> {
  const snapshot = await db.collection(fromPath).get();
  if (snapshot.empty) {
    console.log(`${tag} ${fromPath} — empty, skipping`);
    return 0;
  }
  console.log(`${tag} Copying ${snapshot.size} doc(s): ${fromPath} → ${toPath}`);
  let batch = db.batch();
  let count = 0;
  let total = 0;
  for (const sourceDoc of snapshot.docs) {
    const targetDocId = sourceDoc.id === idRemapFrom ? idRemapTo! : sourceDoc.id;
    const targetRef = db.doc(`${toPath}/${targetDocId}`);
    const data = { ...sourceDoc.data() };
    // Update any field that matches the old ID value to the new ID
    if (sourceDoc.id === idRemapFrom && data['id'] === idRemapFrom) {
      data['id'] = idRemapTo!;
    }
    console.log(`${tag}   ${fromPath}/${sourceDoc.id} → ${toPath}/${targetDocId}`);
    if (!dryRun) {
      batch.set(targetRef, data);
      count++;
      total++;
      if (count >= BATCH_LIMIT) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    } else {
      total++;
    }
  }
  if (!dryRun && count > 0) await batch.commit();
  return total;
}

// ── Migration ─────────────────────────────────────────────────────────────────

async function migrate(): Promise<void> {
  const tag = dryRun ? '[rename:dry-run]' : '[rename]';
  const target = project === 'prod' ? 'foliokit-6f974 (production)' : 'foliokit-6f974 (emulator)';
  console.log(`${tag} Target  : ${target}`);
  console.log(`${tag} From    : tenants/${fromTenant}/`);
  console.log(`${tag} To      : tenants/${toTenant}/`);
  console.log(`${tag} Dry run : ${dryRun}`);
  console.log('');

  // Verify source exists
  const sourceSnap = await db.doc(`tenants/${fromTenant}`).get();
  if (!sourceSnap.exists) {
    console.error(`${tag} ERROR: tenants/${fromTenant} does not exist. Aborting.`);
    process.exit(1);
  }

  let totalCopied = 0;

  // ── Regular subcollections ────────────────────────────────────────────────
  for (const name of SUBCOLLECTIONS) {
    totalCopied += await copyCollection(
      `tenants/${fromTenant}/${name}`,
      `tenants/${toTenant}/${name}`,
      tag,
    );
  }

  // ── site-config (remap doc ID: fromTenant → toTenant) ────────────────────
  totalCopied += await copyCollection(
    `tenants/${fromTenant}/site-config`,
    `tenants/${toTenant}/site-config`,
    tag,
    fromTenant,
    toTenant,
  );

  // ── Tenant registry doc ───────────────────────────────────────────────────
  const sourceData = sourceSnap.data() as Record<string, unknown>;
  const registryDoc = {
    ...sourceData,
    tenantId: toTenant,
    subdomain: toTenant,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  console.log(`${tag} Writing tenant registry: tenants/${toTenant}`);
  if (!dryRun) {
    await db.doc(`tenants/${toTenant}`).set(registryDoc, { merge: false });
  }

  // ── Billing doc ───────────────────────────────────────────────────────────
  // billing/foliokit does not exist in production; create a fresh pro doc.
  const now = admin.firestore.Timestamp.now();
  const billingDoc = {
    tenantId: toTenant,
    stripeCustomerId: '',
    stripePriceId: '',
    plan: 'pro',
    status: 'active',
    trialEndsAt: null,
    currentPeriodEndsAt: now,
  };
  console.log(`${tag} Writing billing doc: billing/${toTenant} (plan: pro, status: active)`);
  if (!dryRun) {
    await db.doc(`billing/${toTenant}`).set(billingDoc, { merge: false });
  }

  console.log('');
  console.log(`${tag} Done.`);
  console.log(`${tag}   Subcollection docs copied : ${totalCopied}`);
  console.log(`${tag}   Registry doc written      : tenants/${toTenant}`);
  console.log(`${tag}   Billing doc written        : billing/${toTenant}`);
  if (dryRun) {
    console.log(`${tag}   (dry-run — no writes were made)`);
  }
}

migrate().catch((err) => {
  console.error('[rename] Fatal error:', err);
  process.exit(1);
});
