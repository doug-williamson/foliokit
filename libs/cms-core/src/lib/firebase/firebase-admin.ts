/**
 * Firebase Admin SDK initializer — Node.js only.
 *
 * Credentials are resolved via Application Default Credentials (ADC):
 *   - App Hosting environments: the managed service account is used automatically.
 *   - CI/CD pipelines: set the GOOGLE_APPLICATION_CREDENTIALS environment variable
 *     to the absolute path of a service account JSON key file before running the
 *     server process.
 *
 * Never import this module in browser bundles. Import directly in SSR server
 * entry files (e.g. apps/blog/src/server.ts) — it is intentionally excluded
 * from the @foliokit/cms-core barrel export.
 */
import admin from 'firebase-admin';

let initialized = false;

export function initAdminApp(): admin.app.App {
  if (!initialized) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env['FIREBASE_PROJECT_ID'],
    });
    initialized = true;
  }
  return admin.app();
}
