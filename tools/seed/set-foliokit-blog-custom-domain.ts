/**
 * Merge `customDomain` on a tenants/{id} doc so blog SSR resolves blog.foliokitcms.com.
 * The setCustomDomain Cloud Function rejects *.foliokitcms.com as reserved, so this
 * script writes directly via the Admin SDK.
 *
 * Usage (repo root):
 *   export GOOGLE_APPLICATION_CREDENTIALS=<path-to-service-account.json>
 *   nx run seed:set-foliokit-blog-custom-domain
 *
 * To target a different tenant doc (e.g. legacy 'foliokit' before the rename migration):
 *   nx run seed:set-foliokit-blog-custom-domain -- --tenant foliokit
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = 'foliokit-6f974';
const tenantArgIdx = process.argv.indexOf('--tenant');
const TENANT_ID = tenantArgIdx !== -1 ? process.argv[tenantArgIdx + 1] : 'foliokitcms';
const DOMAIN = 'blog.foliokitcms.com';

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

const db = getFirestore();

async function main(): Promise<void> {
  const ref = db.doc(`tenants/${TENANT_ID}`);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(
      `[error] tenants/${TENANT_ID} does not exist. Create the tenant document first.`
    );
    process.exit(1);
  }

  await ref.set(
    {
      customDomain: DOMAIN,
      customDomainStatus: 'active',
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(
    `[ok] tenants/${TENANT_ID} merged: customDomain=${DOMAIN}, customDomainStatus=active`
  );
  console.log(
    'Tenant hostname cache (if any) expires within ~5 minutes on running blog servers.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
