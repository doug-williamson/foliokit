import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { AuthService } from '@foliokit/cms-core';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await firstValueFrom(toObservable(auth.user).pipe(filter((u) => u !== undefined)));
  if (auth.isAdmin()) return true;
  return router.createUrlTree(['/login']);
};
