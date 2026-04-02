// Script to register a custom domain with Firebase App Hosting for a FolioKit tenant.
// Usage: npx ts-node tools/scripts/register-custom-domain.ts --tenantId <id> --domain <domain>
//
// This script logs the manual steps required in Firebase Console (and gcloud CLI alternative)
// then marks the tenant's customDomainStatus as 'registration_pending'.

import * as readline from 'readline';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const tenantId = getArg('--tenantId');
const domain = getArg('--domain');

if (!tenantId || !domain) {
  console.error(
    'Usage: npx ts-node tools/scripts/register-custom-domain.ts --tenantId <id> --domain <domain>'
  );
  process.exit(1);
}

const PROJECT_ID = 'foliokit-6f974';
const BACKEND = 'foliokit-blog';

if (!getApps().length) {
  initializeApp({ projectId: PROJECT_ID });
}

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question + ' [y/N] ', (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function main() {
  const db = getFirestore();
  const tenantSnap = await db.doc(`tenants/${tenantId}`).get();

  if (!tenantSnap.exists) {
    console.error(`Tenant '${tenantId}' not found in Firestore.`);
    process.exit(1);
  }

  const tenantData = tenantSnap.data() as { customDomain?: string | null };
  const storedDomain = tenantData.customDomain;

  if (storedDomain && storedDomain !== domain) {
    console.warn(
      `\nWARNING: The tenant's stored customDomain is '${storedDomain}' but you passed '${domain}'.`
    );
    const ok = await confirm('Proceed anyway?');
    if (!ok) {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  console.log('\n=== Manual Firebase Console Steps ===');
  console.log('1. Go to Firebase Console → App Hosting → ' + BACKEND + ' backend');
  console.log('2. Click Domains → Add custom domain');
  console.log('3. Enter: ' + domain);
  console.log('4. Follow the SSL certificate provisioning steps');
  console.log('   Firebase will verify DNS automatically once records propagate.\n');

  console.log('=== gcloud CLI Alternative ===');
  console.log(
    `gcloud beta firebase apphosting domains create ${domain} --backend=${BACKEND} --project=${PROJECT_ID}\n`
  );

  await db.doc(`tenants/${tenantId}`).update({
    customDomainStatus: 'registration_pending',
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(
    `customDomainStatus set to 'registration_pending' for tenant '${tenantId}'.`
  );
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
