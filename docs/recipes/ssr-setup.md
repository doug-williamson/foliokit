# SSR Setup

The blog app uses Angular Server-Side Rendering (SSR) via `@angular/ssr`. The admin and docs apps are statically hosted on Firebase Hosting and do **not** use SSR.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Firebase App Hosting (Cloud Run)                       │
│  apps/blog — SSR, server renders every route           │
│  Runtime: Node.js 22, express server                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Firebase Hosting (CDN)                                 │
│  apps/admin — SPA, static files                        │
│  apps/docs  — SPA, static files                        │
└─────────────────────────────────────────────────────────┘
```

---

## How SSR works in the blog

### 1. Server-side service overrides (`app.config.server.ts`)

The browser app uses `BLOG_POST_SERVICE` and `SITE_CONFIG_SERVICE` tokens to read data from Firestore via the client SDK. On the server these tokens are overridden with Admin SDK implementations:

```ts
// apps/blog/src/app/app.config.server.ts
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: BLOG_POST_SERVICE, useClass: ServerBlogPostService },
    { provide: SITE_CONFIG_SERVICE, useClass: ServerSiteConfigService },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
```

`ServerBlogPostService` and `ServerSiteConfigService` use the **Firebase Admin SDK** (server-only) to read Firestore directly with elevated credentials. They are never included in the browser bundle.

### 2. TransferState hydration pattern

Resolvers store their data in Angular's `TransferState` on the server. The data is serialised into the HTML response as a `<script>` tag. When the browser bootstraps, each resolver checks `TransferState` first:

```ts
// Simplified resolver logic
if (transferState.hasKey(POSTS_KEY)) {
  const data = transferState.get(POSTS_KEY, null);
  transferState.remove(POSTS_KEY);   // consume so browser doesn't re-fetch
  return data;
}
// Server path: fetch from Firestore, then store
return service.getPosts().pipe(
  tap(data => { if (isPlatformServer(platformId)) transferState.set(POSTS_KEY, data); }),
);
```

This eliminates duplicate Firestore reads — the server fetches once; the browser reads from the embedded state.

`POSTS_TRANSFER_KEY` is exported from `@foliokit/cms-core`. The page-specific keys (`ABOUT_PAGE_KEY`, `LINKS_PAGE_KEY`) are internal to their respective resolver files.

### 3. Server routes

All routes use `RenderMode.Server` (defined in `apps/blog/src/app/app.routes.server.ts`), meaning every page render hits the Node.js process. There are no statically pre-rendered routes.

---

## `externalDependencies: ["firebase-admin"]`

The blog's `project.json` build config sets:

```json
"externalDependencies": ["firebase-admin"]
```

This tells esbuild (the server bundler) not to bundle `firebase-admin` — it is loaded at runtime from `node_modules` in the Cloud Run container. Without this flag esbuild attempts to bundle the Admin SDK and fails with native module errors.

---

## Firebase Admin SDK credential resolution

`libs/cms-core/src/lib/firebase/firebase-admin.ts` (server-only, not in the public barrel) initialises the Admin SDK with the following priority:

1. **`GOOGLE_APPLICATION_CREDENTIALS` contains a JSON object**: Firebase App Hosting injects secrets as raw JSON strings (not file paths). If the env var starts with `{`, it is parsed with `admin.credential.cert()`.
2. **Otherwise**: Fall back to Application Default Credentials (ADC). ADC covers:
   - Local dev: `GOOGLE_APPLICATION_CREDENTIALS` set to a service account JSON **file path**
   - Cloud Run managed service account: no configuration needed — ADC picks up the attached SA automatically

**Never import `firebase-admin.ts` in browser bundles.** Import it directly in server entry files (e.g. `apps/blog/src/server.ts`). It is intentionally excluded from the `@foliokit/cms-core` barrel export.

---

## Required environment variables

### Build-time (`NG_APP_*`)

Set in `.env` at the workspace root. Inlined by `@ngx-env/builder` at build time.

| Variable | Description |
|---|---|
| `NG_APP_FIREBASE_API_KEY` | Firebase Web API key |
| `NG_APP_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `NG_APP_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NG_APP_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket |
| `NG_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging sender ID |
| `NG_APP_FIREBASE_APP_ID` | Firebase Web app ID |

> See `docs/recipes/environment-setup.md` for how to find these values.

### Runtime (Node.js server process)

| Variable | Description | Required |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Firebase project ID (same value as `NG_APP_FIREBASE_PROJECT_ID`) | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service account JSON string (App Hosting) or file path (local) | Yes |
| `NG_ALLOWED_HOSTS` | Comma-separated list of allowed request hostnames | Recommended |

---

## Local SSR testing

To test the production SSR build locally:

```bash
# 1. Build the blog (SSR)
nx build blog

# 2. Set runtime environment variables
export FIREBASE_PROJECT_ID=your-project-id
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# 3. Start the server
node dist/apps/blog/server/server.mjs
```

The server listens on `http://localhost:4000` by default.

> Note: Local SSR uses the **production** Firebase project, not the emulator. Use `npm run start:blog` for emulator-connected development.

---

## Deployment

### Blog (App Hosting)

The blog deploys automatically via App Hosting. Pushes to the configured branch trigger a Cloud Build that runs `npm run build` (which maps to `npx nx build blog`), then deploys the resulting server to Cloud Run.

No manual deployment command is needed.

### Admin and docs (Firebase Hosting)

```bash
# Deploy admin
npm run deploy:admin

# Deploy docs
npm run deploy:docs
```

These commands build the respective app then deploy the static files to Firebase Hosting using the targets defined in `firebase.json`.
