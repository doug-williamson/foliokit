# Environment Setup

This guide covers every environment variable FolioKit needs and where each one is used.

---

## Quick start

```bash
cp .env.example .env
# Fill in the values from your Firebase console (see below)
```

---

## Variable reference

| Variable | When used | Source |
|---|---|---|
| `NG_APP_FIREBASE_API_KEY` | Build-time (both apps) | Firebase console → Project settings → Web app |
| `NG_APP_FIREBASE_AUTH_DOMAIN` | Build-time (both apps) | Firebase console → Project settings → Web app |
| `NG_APP_FIREBASE_PROJECT_ID` | Build-time (both apps) | Firebase console → Project settings |
| `NG_APP_FIREBASE_STORAGE_BUCKET` | Build-time (both apps) | Firebase console → Project settings → Web app |
| `NG_APP_FIREBASE_MESSAGING_SENDER_ID` | Build-time (both apps) | Firebase console → Project settings → Web app |
| `NG_APP_FIREBASE_APP_ID` | Build-time (both apps) | Firebase console → Project settings → Web app |
| `FIREBASE_PROJECT_ID` | SSR runtime only (blog server) | Same value as `NG_APP_FIREBASE_PROJECT_ID` |

### Build-time variables (`NG_APP_*`)

The `NG_APP_*` variables are inlined at build time by [`@ngx-env/builder`](https://github.com/chihab/ngx-env). They are accessed in source via:

```ts
import.meta.env['NG_APP_FIREBASE_API_KEY']
```

At build time the builder replaces these expressions with the literal string values from your `.env` file. The resulting browser bundle contains no references to environment variables — everything is baked in.

**Both `apps/admin` and `apps/blog` read the same six `NG_APP_FIREBASE_*` variables** from the same `.env` file at the workspace root.

### Runtime-only variable (`FIREBASE_PROJECT_ID`)

The blog uses Angular SSR (server-side rendering). The Node.js server process reads `FIREBASE_PROJECT_ID` at runtime to initialize the Firebase Admin SDK. This value is NOT inlined at build time and must be set as a runtime environment variable wherever the server runs (Cloud Run, App Hosting, or your local terminal).

It is the same Firebase project ID as `NG_APP_FIREBASE_PROJECT_ID` — both can share the same value.

---

## `adminEmail` is NOT an environment variable

The admin app's `adminEmail` value (used by `provideAdminKit({ adminEmail })`) is **hardcoded** in `apps/admin/src/environments/environment.ts`:

```ts
adminEmail: 'your-admin@example.com',
```

This email must match **all four** authorization surfaces:
1. The Firebase Authentication user (sign in with Google using this account)
2. The `ADMIN_EMAIL` injection token read by `authGuard`
3. Your Firestore security rules (the `isAdmin()` function)
4. The seed data (the author document created by the seed script)

> See `docs/security/admin-authorization.md` for the full authorization model (Phase 4).

---

## Where to find your Firebase credentials

1. Open the [Firebase console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → **Project settings**
4. Scroll to **Your apps** → select your Web app (or create one)
5. Copy the `firebaseConfig` object values into `.env`

---

## SSR runtime environment (blog server only)

The blog server needs two additional runtime variables beyond the build-time `NG_APP_*` set:

| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase project ID (same as `NG_APP_FIREBASE_PROJECT_ID`) |
| `GOOGLE_APPLICATION_CREDENTIALS` | ADC file path **or** a JSON service account object (App Hosting injects the JSON string directly) |
| `NG_ALLOWED_HOSTS` | Comma-separated list of allowed hostnames (e.g. `yourdomain.com`) |

> See `docs/recipes/ssr-setup.md` for the full SSR credential and deployment guide.

---

## Local development

During local development both apps connect to the **Firebase Emulator Suite** — no real Firebase credentials are needed for the emulator connection itself.

- **Blog** (`apps/blog`): uses hardcoded emulator credentials in `apps/blog/src/environments/environment.ts` (`apiKey: 'local-dev'`, `projectId` from `tools/seed/emulator-config.ts`). The `.env` file `NG_APP_*` values are **not** used by the blog in dev mode.
- **Admin** (`apps/admin`): reads `NG_APP_FIREBASE_*` from `.env` even in dev mode. Fill in real values — the emulator intercepts the connection because `useEmulator: true` is set in `environment.ts`.

> See `docs/recipes/local-dev.md` for the full local development guide.
