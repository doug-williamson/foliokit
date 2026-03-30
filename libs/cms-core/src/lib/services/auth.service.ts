import { computed, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { ADMIN_EMAIL, FIREBASE_AUTH } from '../firebase/firebase.config';
import { TenantConfigRef } from '../tokens/tenant-config.token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);
  private readonly adminEmail = inject(ADMIN_EMAIL, { optional: true });
  private readonly tenantConfigRef = inject(TenantConfigRef, { optional: true });

  readonly user = toSignal(
    new Observable<User | null>((subscriber) => {
      if (!this.auth) {
        subscriber.next(null);
        subscriber.complete();
        return;
      }
      return onAuthStateChanged(this.auth, (u) => subscriber.next(u));
    }),
    { requireSync: false, initialValue: undefined },
  );

  readonly isAuthenticated = computed(() => this.user() != null);

  /**
   * Returns true when the authenticated user is authorized to manage
   * the current tenant's content. Checks (in order):
   *
   * 1. The tenant document's `ownerEmail` (loaded at app init via
   *    `TenantConfigRef`) — this is the primary multi-tenant check.
   * 2. The static `ADMIN_EMAIL` token — used as the platform
   *    super-admin fallback and for backward compatibility.
   */
  readonly isAdmin = computed(() => {
    const email = this.user()?.email;
    if (!email) return false;
    const ownerEmail = this.tenantConfigRef?.config?.ownerEmail;
    if (ownerEmail && email === ownerEmail) return true;
    return this.adminEmail ? email === this.adminEmail : false;
  });

  async signInWithGoogle(): Promise<void> {
    if (!this.auth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'login' });
    await signInWithPopup(this.auth, provider);
  }

  async signOut(): Promise<void> {
    if (!this.auth) return;
    await signOut(this.auth);
  }
}
