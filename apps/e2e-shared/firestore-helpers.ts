/**
 * Firestore helpers for e2e tests.
 *
 * Uses the Firebase Admin SDK pointed at the local emulator.
 * All functions are async and safe to call from Playwright test/beforeEach hooks.
 *
 * IMPORTANT: FIRESTORE_EMULATOR_HOST must be set before any Firestore
 * operation executes.  This module sets it at load time so it is in effect
 * before the first Admin SDK call.
 */

// Must be set before firebase-admin connects to Firestore.
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';

import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { execSync } from 'child_process';
import * as path from 'path';

const PROJECT_ID = 'foliokit-6f974';
const WORKSPACE_ROOT = path.join(__dirname, '..', '..');

let _db: Firestore | undefined;

function db(): Firestore {
  if (!_db) {
    if (!getApps().length) {
      initializeApp({ projectId: PROJECT_ID });
    }
    _db = getFirestore();
  }
  return _db;
}

/**
 * Clears ALL documents in the emulator Firestore database.
 * Use in beforeAll/beforeEach when tests need a completely clean slate.
 */
export async function resetFirestore(): Promise<void> {
  const response = await fetch(
    `http://localhost:8080/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  if (!response.ok && response.status !== 200 && response.status !== 204) {
    const body = await response.text();
    throw new Error(`[firestore-helpers] resetFirestore failed: ${response.status} ${body}`);
  }
}

/**
 * Resets Firestore and re-runs the seed script to restore baseline test data.
 */
export async function reseedFirestore(): Promise<void> {
  await resetFirestore();
  execSync('npx nx run seed:emulator', {
    cwd: WORKSPACE_ROOT,
    stdio: 'pipe',
  });
}

/**
 * Sets site-config/default pages.about.enabled.
 * Fast — performs a targeted field update rather than a full document rewrite.
 */
export async function setAboutEnabled(enabled: boolean): Promise<void> {
  await db()
    .collection('site-config')
    .doc('default')
    .update({ 'pages.about.enabled': enabled });
}

/**
 * Sets site-config/default pages.about.bio (used to test the "no bio" guard path).
 */
export async function setAboutBio(bio: string): Promise<void> {
  await db()
    .collection('site-config')
    .doc('default')
    .update({ 'pages.about.bio': bio });
}

/**
 * Sets site-config/default pages.links.enabled.
 */
export async function setLinksEnabled(enabled: boolean): Promise<void> {
  await db()
    .collection('site-config')
    .doc('default')
    .update({ 'pages.links.enabled': enabled });
}

/**
 * Clears the links array in site-config/default (used to test the "no links" guard path).
 */
export async function clearLinks(): Promise<void> {
  await db()
    .collection('site-config')
    .doc('default')
    .update({ 'pages.links.links': [] });
}

/**
 * Reads a raw Firestore document.  Returns null if the document does not exist.
 */
export async function readDoc(
  collection: string,
  docId: string,
): Promise<FirebaseFirestore.DocumentData | null> {
  const snap = await db().collection(collection).doc(docId).get();
  return snap.exists ? (snap.data() ?? null) : null;
}

/**
 * Reads site-config/default and returns the pages.about.enabled flag.
 */
export async function getAboutEnabled(): Promise<boolean | undefined> {
  const data = await readDoc('site-config', 'default');
  return data?.['pages']?.about?.enabled;
}

/**
 * Reads site-config/default and returns the pages.links.enabled flag.
 */
export async function getLinksEnabled(): Promise<boolean | undefined> {
  const data = await readDoc('site-config', 'default');
  return data?.['pages']?.links?.enabled;
}
