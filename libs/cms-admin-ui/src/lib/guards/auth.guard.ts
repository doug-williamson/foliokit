import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { doc, getDoc } from 'firebase/firestore';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService, FIRESTORE, SiteIdRef } from '@foliokit/cms-core';

/**
 * Tracks whether the first-run Firestore ownership check has passed for
 * this page session. Resets on full page refresh (SPA lifetime).
 */
let ownershipVerified = false;

/**
 * Protects admin routes by requiring an authenticated user whose email
 * matches the `ownerEmail` field on the resolved tenant document.
 *
 * Waits for Firebase Auth's persisted session to resolve before checking.
 * On the first guarded navigation per session, performs a one-time Firestore
 * read to verify the tenant document still lists the user as the owner
 * (guards against ownership transfer or tenant deletion after login).
 *
 * Redirects to `/login` when the user is not authenticated or not the
 * tenant owner.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const siteIdRef = inject(SiteIdRef);

  // Wait for Firebase Auth to settle (persisted session from IndexedDB).
  await firstValueFrom(
    toObservable(auth.user).pipe(filter((u) => u !== undefined)),
  );

  const user = auth.user();
  if (!user || !siteIdRef.value) {
    return router.createUrlTree(['/login']);
  }

  // First guarded route per session: verify ownership via Firestore read.
  if (!ownershipVerified) {
    const firestore = inject(FIRESTORE);
    if (firestore) {
      const snap = await getDoc(doc(firestore, 'tenants', siteIdRef.value));
      if (!snap.exists() || snap.data()?.['ownerEmail'] !== user.email) {
        return router.createUrlTree(['/login']);
      }
    }
    ownershipVerified = true;
  }

  return true;
};
