import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '@foliokit/cms-core';

/**
 * Protects admin routes by requiring an authenticated admin user.
 *
 * Waits for Firebase Auth's persisted session to resolve before checking
 * `isAdmin()`. Without the `filter(u => u !== undefined)` step the guard
 * would redirect on first navigation while Auth is still initialising,
 * even when a valid session exists in IndexedDB.
 *
 * Redirects to `/login` when the user is not an admin.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await firstValueFrom(toObservable(auth.user).pipe(filter((u) => u !== undefined)));
  if (auth.isAdmin()) return true;
  return router.createUrlTree(['/login']);
};
