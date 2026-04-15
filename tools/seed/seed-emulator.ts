/**
 * Firestore emulator seed script
 *
 * Seeds the Firebase Auth and Firestore emulators:
 *   - Auth: creates the sole admin user
 *   - Firestore: creates the tenant document so isTenantOwner() resolves
 *     correctly on first login (no PERMISSION_DENIED on setup writes)
 *
 * Prerequisites:
 *   1. Start the Firebase emulator suite:
 *        npm run emulator
 *   2. In a separate terminal, run:
 *        npm run seed
 */

// Must be set before any firebase-admin import to redirect traffic to the emulators.
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { FIREBASE_EMULATOR_PROJECT_ID } from './emulator-config';

const ADMIN_EMAIL = 'dev.foliokit@gmail.com';
const TENANT_ID = 'foliokitcms';

initializeApp({ projectId: FIREBASE_EMULATOR_PROJECT_ID });

async function seed(): Promise<void> {
  try {
    console.log(`[seed:emulator] Creating admin user ${ADMIN_EMAIL}...`);
    const { errors } = await getAuth().importUsers([
      {
        uid: 'admin-dev',
        email: ADMIN_EMAIL,
        emailVerified: true,
        displayName: 'Dev FolioKit',
        providerData: [
          {
            uid: ADMIN_EMAIL,
            email: ADMIN_EMAIL,
            displayName: 'Dev FolioKit',
            providerId: 'google.com',
          },
        ],
      },
    ]);
    if (errors.length) {
      console.warn('[seed:emulator] Auth warnings:', errors.map((e) => e.error.message));
    }
    console.log('[seed:emulator] Admin user created.');

    console.log(`[seed:emulator] Creating tenant document tenants/${TENANT_ID}...`);
    const db = getFirestore();
    await db.collection('tenants').doc(TENANT_ID).set(
      {
        tenantId: TENANT_ID,
        ownerEmail: ADMIN_EMAIL,
        subdomain: TENANT_ID,
        customDomain: null,
        displayName: 'Dev FolioKit',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    console.log('[seed:emulator] Tenant document created.');

    console.log('[seed:emulator] Done.');
  } catch (err) {
    console.error('[seed:emulator] Error:', err);
    process.exit(1);
  }
}

seed();
