/**
 * Firestore emulator seed script — bare-auth
 *
 * Seeds the Firebase Auth and Firestore emulators with the minimum required
 * data to log in as the admin user:
 *   - Auth: creates the sole admin user
 *   - Firestore: creates the tenant document so isTenantOwner() resolves
 *     correctly on first login (no PERMISSION_DENIED on setup writes)
 *
 * Prerequisites:
 *   1. Start the Firebase emulator suite:
 *        npm run emulator
 *   2. In a separate terminal, run:
 *        npx nx run seed:bare-auth
 */

// Must be set before any firebase-admin import to redirect traffic to the emulators.
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { FIREBASE_EMULATOR_PROJECT_ID } from './emulator-config';

const ADMIN_EMAIL = 'dev.foliokit@gmail.com';
const TENANT_ID = 'foliokitcms';

initializeApp({ projectId: FIREBASE_EMULATOR_PROJECT_ID });

async function seed(): Promise<void> {
  try {
    console.log(`[seed:bare-auth] Creating admin user ${ADMIN_EMAIL}...`);
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
      console.warn('[seed:bare-auth] Auth warnings:', errors.map((e) => e.error.message));
    }
    console.log('[seed:bare-auth] Admin user created.');

    console.log(`[seed:bare-auth] Creating tenant document tenants/${TENANT_ID}...`);
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
    console.log('[seed:bare-auth] Tenant document created.');

    console.log(`[seed:bare-auth] Creating billing document billing/${TENANT_ID}...`);
    await db.collection('billing').doc(TENANT_ID).set({
      tenantId: TENANT_ID,
      stripeCustomerId: '',
      stripePriceId: '',
      plan: 'agency_internal',
      status: 'active',
      trialEndsAt: null,
      currentPeriodEndsAt: Timestamp.fromDate(new Date('2099-01-01')),
    });
    console.log('[seed:bare-auth] Billing document created.');

    console.log('[seed:bare-auth] Done.');
  } catch (err) {
    console.error('[seed:bare-auth] Error:', err);
    process.exit(1);
  }
}

seed();
