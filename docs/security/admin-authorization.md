# Admin Authorization Model

FolioKit enforces admin identity at four independent surfaces. All four must use the same email address — keeping them in sync is a deployment responsibility.

---

## The four surfaces

### 1. `ADMIN_EMAIL` injection token (Angular DI)

**File:** `libs/cms-core/src/lib/firebase/firebase.config.ts`
**Registered by:** `provideAdminKit({ adminEmail })` in your `app.config.ts`

`AuthService.isAdmin()` is a computed signal that compares the currently signed-in user's email against the injected `ADMIN_EMAIL` token:

```ts
// libs/cms-core/src/lib/services/auth.service.ts
readonly isAdmin = computed(() => {
  const email = this.user()?.email;
  if (!email) return false;
  return this.adminEmail ? email === this.adminEmail : false;
});
```

This is a **client-side** check used to guard UI routes and conditionally render admin UI. It is **not** a security boundary on its own — Firestore rules are the authoritative enforcement point.

---

### 2. `authGuard` (Angular Router)

**File:** `libs/cms-admin-ui/src/lib/guards/auth.guard.ts`
**Applied to:** All admin routes in `adminRoutes`

The guard waits for Firebase Auth to restore any persisted session (the `filter(u => u !== undefined)` step handles the initial `undefined` state during hydration), then calls `auth.isAdmin()`. If it returns `false`, the user is redirected to `/login`.

```ts
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await firstValueFrom(toObservable(auth.user).pipe(filter((u) => u !== undefined)));
  if (auth.isAdmin()) return true;
  return router.createUrlTree(['/login']);
};
```

This is a **route-level** check. Like all Angular guards, it runs in the browser — it cannot replace server-side Firestore rule enforcement.

---

### 3. `firestore.rules` `isAdmin()` function (server-side)

**File:** `firestore.rules`

This is the **authoritative security boundary**. Firestore rules run on Google's servers and cannot be bypassed by a client. Every write operation and restricted read goes through this check.

```
function isAdmin() {
  return request.auth != null && request.auth.token.email == 'YOUR_ADMIN_EMAIL';
}
```

**Important:** Firestore rules cannot read from environment variables or runtime configuration. The email address **must be hardcoded** in this file. Replace `'YOUR_ADMIN_EMAIL'` with your actual admin email address before deploying rules.

Deploy updated rules with:
```bash
firebase deploy --only firestore:rules --project <your-project-id>
```

---

### 4. Seed data (author document)

**File:** `tools/seed/` (specific file varies)

The seed script creates an initial author document in Firestore. The email on this document should match the admin email so the admin has an author profile linked to their account when they first sign in.

If the emails don't match, the admin can sign in and manage content, but posts created by the admin won't be associated with a valid author profile until the author document is updated.

---

## Keeping them in sync

When you change the admin email (e.g., moving from a dev account to a production account):

| Step | What to update |
|---|---|
| 1 | Update `adminEmail` in `apps/admin/src/environments/environment.ts` (and `environment.prod.ts`) |
| 2 | Update the `isAdmin()` email in `firestore.rules` |
| 3 | Deploy Firestore rules: `firebase deploy --only firestore:rules` |
| 4 | Update (or recreate) the author document in Firestore if it uses the old email |
| 5 | Sign in to Firebase Auth using the new email (the old Google account will no longer have access) |

---

## Security notes

- **`authGuard` is not a security boundary.** A determined attacker can modify client-side JavaScript to bypass Angular guards. All write protection must be enforced at the Firestore rules level.
- **The `ADMIN_EMAIL` token is client-side.** Its value is inlined into the browser bundle at build time (it's passed via `provideAdminKit({ adminEmail })`). Do not treat it as a secret — use it only for UI gating, not access control.
- **Only one admin is supported** by the current rules design. For multi-admin support, consider using Firebase custom claims (`admin: true`) instead of email comparison. The `isAdmin()` rule would then become `request.auth.token.admin == true`, and `AuthService.isAdmin()` would read `user().getIdTokenResult().claims['admin']`.
