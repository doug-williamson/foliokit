# Local Development

Run the full FolioKit stack locally with a single command.

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20+ | Required by all scripts |
| Java | 11+ | Required by Firebase emulator |
| Firebase CLI | Latest | `npm install -g firebase-tools` |
| `.env` file | — | Copy `.env.example` → `.env`; fill in admin app Firebase credentials |

---

## One-command startup

```bash
npm run dev:all
```

This starts four processes in parallel and coordinates their startup order:

1. **Emulator** — Firebase Auth (9099), Firestore (8080), Storage (9199), Emulator UI (4000)
2. **Seed** — waits for Firestore on port 8080, seeds test data once, then exits
3. **Blog dev server** — waits for Firestore on port 8080, then starts on port 4201
4. **Admin dev server** — waits for Firestore on port 8080, then starts on port 4203

All four processes share the same terminal session with colour-coded output (`cyan`, `yellow`, `green`, `blue`). Ctrl+C stops everything.

---

## Port map

| Service | Port | URL |
|---|---|---|
| Firebase Auth emulator | 9099 | (internal) |
| Firestore emulator | 8080 | (internal) |
| Storage emulator | 9199 | (internal) |
| Emulator UI | 4000 | http://localhost:4000 |
| Blog dev server | 4201 | http://localhost:4201 |
| Docs dev server | 4202 | http://localhost:4202 |
| Admin dev server | 4203 | http://localhost:4203 |

---

## Individual scripts

| Script | What it does |
|---|---|
| `npm run emulator` | Start Firebase emulators (fresh state each run) |
| `npm run emulator:data` | Start emulators, import `.firebase/emulator-data`, export on exit |
| `npm run seed` | Seed test data into the running emulator |
| `npm run start:blog` | Start blog dev server (requires emulator already running) |
| `npm run start:admin` | Start admin dev server (requires emulator already running) |
| `npm run start:docs` | Start docs dev server (no emulator dependency) |

---

## How each app connects to the emulator

**Blog** (`apps/blog`):

The blog's `apps/blog/src/environments/environment.ts` contains hardcoded emulator credentials:

```ts
export const environment: Environment = {
  isProd: false,
  useEmulator: true,
  firebase: {
    apiKey: 'local-dev',       // emulator ignores credentials
    projectId: FIREBASE_EMULATOR_PROJECT_ID,  // shared with seed script
    // other fields empty
  },
};
```

The `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` env var (set by `start:blog`) tells the Firebase SDK to connect to the local emulator instead of production. The blog does **not** require a populated `.env` file for local dev.

**Admin** (`apps/admin`):

The admin reads `NG_APP_FIREBASE_*` from `.env` at build time. The emulator intercepts the connection because `useEmulator: true` is set in `apps/admin/src/environments/environment.ts`. Fill in real Firebase project credentials in `.env` — the emulator still intercepts the traffic.

---

## Resetting emulator data

By default `npm run emulator` starts with a clean state each time. To persist data across restarts use:

```bash
npm run emulator:data
```

This imports `.firebase/emulator-data` on startup and exports the final state on exit. To discard saved data and start fresh, delete `.firebase/emulator-data/` and use `npm run emulator`.

---

## Troubleshooting

### Port already in use

One of the required ports (8080, 9099, 9199, 4000, 4201, 4203) is occupied by another process.

```bash
# Find what's using port 8080 (PowerShell)
Get-NetTCPConnection -LocalPort 8080

# macOS / Linux
lsof -i :8080
```

Kill the conflicting process, then retry.

### Seed reports `UNAVAILABLE` / connection refused

The seed script started before Firestore was ready. `npm run dev:all` uses `wait-on tcp:127.0.0.1:8080` to guard against this, but if you are running the seed manually, wait until the emulator UI is visible at http://localhost:4000 before running `npm run seed`.

### Admin shows production Firestore data

The admin's `useEmulator` flag connects it to the local emulator, but only when the Firebase project ID matches. Confirm `NG_APP_FIREBASE_PROJECT_ID` in `.env` is set and the emulator is running. If the admin still hits production, check the browser console for the Firebase SDK initialisation log — it should say `[Firebase] Using emulator`.

### `dev:all` exits immediately

`concurrently --kill-others-on-fail` terminates all processes if one exits with a non-zero code. The seed script is the most common culprit — it exits 0 on success and non-zero on error. Check the yellow (seed) output pane for errors and re-run `npm run seed` in isolation to debug.
