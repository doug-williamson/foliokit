// One-time script to grant superadmin role to a Firebase Auth user.
// Usage: npx ts-node tools/scripts/set-superadmin-claim.ts <uid> [--project foliokit-prod]
// Find your UID in Firebase Console → Authentication → Users.
// After running, sign out and back in to the admin app for the claim to take effect.
// Never commit UIDs or email addresses to source — run this locally only.

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { App } from 'firebase-admin/app';

const args = process.argv.slice(2);
const projectFlagIdx = args.indexOf('--project');
const project = projectFlagIdx !== -1 ? args[projectFlagIdx + 1] : 'foliokit-dev';
const uid = args.find((a, i) => !a.startsWith('--') && i !== projectFlagIdx + 1);

if (!uid) {
  console.error('Usage: npx ts-node tools/scripts/set-superadmin-claim.ts <uid> [--project foliokit-prod]');
  process.exit(1);
}

const app: App = getApps().length
  ? getApps()[0]
  : initializeApp({ projectId: project });

getAuth(app)
  .setCustomUserClaims(uid, { role: 'superadmin' })
  .then(() => {
    console.log(`superadmin claim set for UID: ${uid} (project: ${project})`);
    console.log('User must sign out and back in for the claim to take effect.');
  })
  .catch((err) => {
    console.error('Failed to set custom claim:', err);
    process.exit(1);
  });
