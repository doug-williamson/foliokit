import { InjectionToken } from '@angular/core';
import type { FirebaseApp, FirebaseOptions } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Auth } from 'firebase/auth';

export const FIREBASE_OPTIONS = new InjectionToken<FirebaseOptions>('FIREBASE_OPTIONS');
export const FIREBASE_APP = new InjectionToken<FirebaseApp>('FIREBASE_APP');
export const FIRESTORE = new InjectionToken<Firestore | null>('FIRESTORE');
export const FIREBASE_STORAGE = new InjectionToken<FirebaseStorage | null>('FIREBASE_STORAGE');
export const FIREBASE_AUTH = new InjectionToken<Auth | null>('FIREBASE_AUTH');
/**
 * The email address that identifies the admin user.
 *
 * Injected by `provideAdminKit({ adminEmail })` and read by
 * `AuthService.isAdmin()` to gate all write operations.
 *
 * **Must match all four authorization surfaces:**
 * 1. The Firebase Authentication account (Google sign-in email)
 * 2. The `adminEmail` passed to `provideAdminKit()` in `app.config.ts`
 * 3. The `isAdmin()` function in `firestore.rules`
 * 4. The author document created by the seed script
 *
 * @deprecated TODO: Remove — replaced by Firestore-backed `ownerEmail`
 * check via `resolveTenantFromAuth()` and the auth guard's ownership
 * verification. Kept temporarily for backward compatibility.
 *
 * @see {@link https://github.com/dougwilliamson/foliokit/blob/main/docs/security/admin-authorization.md}
 */
export const ADMIN_EMAIL = new InjectionToken<string>('ADMIN_EMAIL');
