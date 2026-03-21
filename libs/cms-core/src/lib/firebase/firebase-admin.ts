/**
 * Firebase Admin SDK initializer — Node.js only.
 *
 * Credential resolution order:
 *   1. If GOOGLE_APPLICATION_CREDENTIALS contains a JSON object (Firebase App
 *      Hosting injects secret values as raw strings, not file paths), parse it
 *      directly with admin.credential.cert().
 *   2. Otherwise fall back to Application Default Credentials (ADC), which
 *      covers local dev (file-path env var) and Cloud Run managed SA.
 *
 * Never import this module in browser bundles. Import directly in SSR server
 * entry files (e.g. apps/blog/src/server.ts) — it is intentionally excluded
 * from the @foliokit/cms-core barrel export.
 */
import admin from 'firebase-admin';

let initialized = false;

export function initAdminApp(): admin.app.App {
  if (!initialized) {
    const credEnv = process.env['GOOGLE_APPLICATION_CREDENTIALS'];
    const credential = credEnv?.trimStart().startsWith('{')
      ? admin.credential.cert(
          JSON.parse(credEnv) as admin.ServiceAccount,
        )
      : admin.credential.applicationDefault();

    admin.initializeApp({
      credential,
      projectId: process.env['FIREBASE_PROJECT_ID'],
    });
    initialized = true;
  }
  return admin.app();
}
