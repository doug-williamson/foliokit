import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';

/**
 * Resolves the tenant ID for the currently authenticated user by querying
 * the Firestore `tenants` collection for a document whose `ownerEmail`
 * matches the user's email.
 *
 * This is a plain async factory function — not an Angular service — so it
 * can be called from an `APP_INITIALIZER` or any other async context.
 *
 * @throws {Error} `'unauthenticated'` — no user is signed in.
 * @throws {Error} `'tenant_not_found'` — authenticated but no tenant matches.
 * @throws {Error} `'tenant_ambiguous'` — more than one tenant matches (data integrity issue).
 *
 * @returns The `tenantId` (Firestore document ID) of the matching tenant.
 */
export async function resolveTenantFromAuth(
  auth: Auth,
  firestore: Firestore,
): Promise<string> {
  await auth.authStateReady();

  const user = auth.currentUser;
  if (!user) {
    throw new Error('unauthenticated');
  }

  const tenantsQuery = query(
    collection(firestore, 'tenants'),
    where('ownerEmail', '==', user.email),
    limit(2), // fetch at most 2 to detect ambiguity
  );

  const snap = await getDocs(tenantsQuery);

  if (snap.empty) {
    throw new Error('tenant_not_found');
  }

  if (snap.size > 1) {
    const ids = snap.docs.map((d) => d.id);
    console.error(
      `[FolioKit] Ambiguous tenant resolution: email "${user.email}" matches multiple tenants: ${ids.join(', ')}. ` +
      'Each email must own exactly one tenant.',
    );
    throw new Error('tenant_ambiguous');
  }

  return snap.docs[0].id;
}
