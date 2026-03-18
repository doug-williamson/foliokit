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
import { FIREBASE_AUTH } from '../firebase/firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(FIREBASE_AUTH);

  readonly user = toSignal(
    new Observable<User | null>((subscriber) => {
      if (!this.auth) {
        subscriber.next(null);
        subscriber.complete();
        return;
      }
      return onAuthStateChanged(this.auth, (u) => subscriber.next(u));
    }),
    { requireSync: false, initialValue: null },
  );

  readonly isAuthenticated = computed(() => this.user() !== null);

  async signInWithGoogle(): Promise<void> {
    if (!this.auth) return;
    await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async signOut(): Promise<void> {
    if (!this.auth) return;
    await signOut(this.auth);
  }
}
