/**
 * Firestore emulator seed script — bare minimum for local development.
 *
 * Creates only the Auth emulator user for dev.foliokit@gmail.com (Google provider).
 * No Firestore documents — add tenant/site data yourself or use `npm run seed:e2e`
 * for the full Playwright baseline.
 *
 * Prerequisites:
 *   1. Start the Firebase emulator suite: npm run emulator
 *   2. Run: npm run seed
 */

process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FIREBASE_EMULATOR_PROJECT_ID } from './emulator-config';

initializeApp({ projectId: FIREBASE_EMULATOR_PROJECT_ID });

async function seed(): Promise<void> {
  try {
    console.log('[seed:emulator] Creating admin user dev.foliokit@gmail.com...');
    const { errors } = await getAuth().importUsers([
      {
        uid: 'admin-dev',
        email: 'dev.foliokit@gmail.com',
        emailVerified: true,
        displayName: 'Dev FolioKit',
        providerData: [
          {
            uid: 'dev.foliokit@gmail.com',
            email: 'dev.foliokit@gmail.com',
            displayName: 'Dev FolioKit',
            providerId: 'google.com',
          },
        ],
      },
    ]);
    if (errors.length) {
      console.warn('[seed:emulator] Admin user import warnings:', errors.map((e) => e.error.message));
    }

    console.log('[seed:emulator] Done. Auth user only (no Firestore writes).');
  } catch (err) {
    console.error('[seed:emulator] Error:', err);
    process.exit(1);
  }
}

seed();
