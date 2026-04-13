# CLAUDE.md — FolioKit

Angular 21 + Firebase CMS toolkit. Nx monorepo. Pre-revenue, moving toward multi-tenant SaaS (Phase 11).

---

## Repo Layout

```
apps/
  blog/        # SSR public blog — Firebase App Hosting (port 4201)
  admin/       # CMS dashboard SPA — Firebase Hosting (port 4203)
  docs/        # Static docs site — Firebase Hosting (port 4202)
  blog-e2e / admin-e2e / docs-e2e / e2e-shared
libs/
  cms-core/    # Models, services, DI tokens, ng-add schematic (stable, v1.0.5)
  cms-ui/      # Shell, page components, ThemeService, design tokens
  cms-markdown/ # Markdown renderer with embedded media
  cms-admin-ui/ # Signal stores, board/list/editor components (pre-release, --tag next)
  docs-ui/     # Docs UI components
functions/     # Cloud Functions (Node.js 22, Express)
tools/
  scripts/     # Build & verification
  seed/        # Firestore seeding
  migrations/  # Data migration scripts
```

Firebase projects: `foliokit-dev` (emulator/staging), `foliokit-prod`.  
GitHub default branch: **`master`** (not `main`).

---

## Module Boundaries (enforced by @nx/enforce-module-boundaries)

- `scope:shared` libs → can only depend on other `scope:shared` libs
- `scope:blog` → depends on `scope:shared` only
- `scope:admin` → depends on `scope:shared` and `scope:admin`

Never create cross-scope imports that violate these rules.

---

## Non-Negotiable Engineering Conventions

**These are hard rules, not preferences. Never deviate.**

1. `ChangeDetectionStrategy.OnPush` on every component — no exceptions.
2. Signals via `toSignal()` at the component layer. Observables only at service boundaries.
3. Standalone components everywhere. No NgModules.
4. No `@angular/fire`. Use the raw Firebase modular SDK (client) and `firebase-admin` (server) directly.
5. SSR-safe code. Never wrap server-renderable content in `isPlatformBrowser()`. Angular SSR polyfills `DOCUMENT` server-side; JSON-LD and canonical links must render server-side.
6. Tailwind for layout/spacing. Angular Material for interactive component internals.
7. No prop drilling — use DI tokens and NgRx Signal stores.
8. Lazy loading with `loadComponent()`. Route data injection via `withComponentInputBinding()`.
9. New control flow syntax: `@if`, `@for`, `@else` — not `*ngIf` / `*ngFor`.
10. Conventional commits required (CommitLint enforced). Prettier with `singleQuote: true`.

---

## Common Commands

```bash
npm run dev:all                  # Emulators + seed + all apps
npm run start:blog               # Blog only (port 4201)
npm run start:admin              # Admin only (port 4203)
npm run start:docs               # Docs only (port 4202)
npm run emulator                 # Firebase emulators only
npm run seed                     # Seed Auth (dev user); `npm run seed:e2e` for Playwright baseline
npm run build:all                # Build everything
npm run build:libs               # Build all 5 libraries
npm run verify:publish-artifacts # Verify dist packages
npx nx test <project>            # Unit tests (Vitest)
npx nx e2e <project>-e2e        # E2E tests (Playwright)
npx nx lint <project>            # ESLint
npm run deploy:admin             # Deploy admin SPA
npm run deploy:docs              # Deploy docs site
npm run deploy:functions         # Deploy Cloud Functions
```

**Authentication-required npm commands (dist-tag, publish) must be run locally — never in CI prompts.**

---

## Component Pattern

```typescript
@Component({
  selector: 'fk-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule],
  template: `
    @if (post()) {
      <h1>{{ post()!.title }}</h1>
    } @else {
      <p>Loading...</p>
    }
  `,
})
export class ExampleComponent {
  private readonly postService = inject(BLOG_POST_SERVICE);
  readonly post = toSignal(this.postService.getPost(this.id));
  readonly id = input.required<string>(); // withComponentInputBinding()
}
```

---

## Services & DI Tokens

Key injection tokens (defined in `cms-core`):

| Token | Type |
|-------|------|
| `BLOG_POST_SERVICE` | `BlogPostService` |
| `FIRESTORE` | `Firestore` |
| `FIREBASE_STORAGE` | `FirebaseStorage` |
| `FIREBASE_AUTH` | `Auth` |
| `ADMIN_EMAIL` | `string` |
| `SITE_CONFIG` | `SiteConfig` |
| `TENANT_COLLECTION_PREFIX` | `string` |

Services return `Observable<T>` for SSR TransferState compatibility. Factory providers: `provideFolioKit()`, `provideAdminKit()`, `provideMarkdown()`.

---

## State Management (NgRx Signal Stores)

Used in `cms-admin-ui` only. Pattern:

```typescript
export const PostEditorStore = signalStore(
  withState<PostEditorState>(initialState),
  withComputed(({ post }) => ({
    isDirty: computed(() => /* ... */),
  })),
  withMethods((store, svc = inject(BLOG_POST_SERVICE)) => ({
    save(): void {
      patchState(store, { saving: true });
      // ...
    },
  })),
);
```

`patchState()` for all mutations — never mutate state directly.

---

## Firestore Schema

**Current (Phase 11 migration in progress):**

```
/tenants/{tenantId}/posts/{postId}
/tenants/{tenantId}/authors/{authorId}
/tenants/{tenantId}/tags/{tagId}
/tenants/{tenantId}/site-config/default   ← kebab-case, doc ID is "default"
/billing/{tenantId}                        ← Stripe-managed, separate root
```

`site-config` is kebab-case. The document ID in single-tenant mode is `default`.  
All collection paths go through `collectionPaths()` factory — never hardcode `/tenants/...` strings inline.  
`tenantId` is subdomain-derived (e.g., `foliokitcms`, `dougwilliamson`).

**Do not touch `/sites/{siteId}/` paths** — that's the deprecated naming convention being migrated away from.

---

## SSR Architecture (Blog App)

- Blog uses Firebase App Hosting (SSR via Cloud Run), GitHub integration on `master`.
- Admin and Docs use plain Firebase Hosting (static/CSR).
- Route resolvers are factory functions: `createPostsResolver()`, `createAboutPageResolver()`, etc.
- Use `TransferState` API to avoid duplicate Firestore reads on hydration.
- Dual app configs: `app.config.ts` (browser) and `app.config.server.ts` (server).
- `withEventReplay()` for event handling during hydration.
- **`PostDetailComponent` must migrate to `RenderMode.Server`** before Phase 11 tenant routing is complete — still on `RenderMode.Client` as of Phase 11a.

---

## Theming System

Light/dark mode via `data-theme` attribute on `<html>`. Tailwind `dark:` variants do **not** apply — do not use them. `ThemeService` in `cms-ui` reads system preference and stores choice in `localStorage`.

**Semantic token contract (CSS custom properties):**

```css
--bg, --surface-0, --surface-1, --surface-2, --surface-3
--border, --border-strong
--text-primary, --text-secondary, --text-muted, --text-accent
--font-display, --font-body, --font-mono
--focus-ring, --focus-border
--shadow-sm, --shadow-md, --shadow-lg
--mat-sys-*   ← Material Design system tokens
```

Primitives live in `cms-ui`. Semantic tokens reference primitives. Theme overrides only reassign semantic tokens — never primitives. CSS custom properties are the token system; SCSS variables are not.

**v3 brand:** Fraunces (display) + Plus Jakarta Sans (body) + JetBrains Mono (mono). Teal accent on cool slate palette. Canonical reference: `foliokit-brand-v3.html` in project root.

---

## Versioning & Publishing

- Nx Release for independent per-package versioning with per-package git tags.
- No `v` prefix in `package.json` version fields (`v0.x.x` prefix reserved for Git tags only).
- `cms-admin-ui` is pre-release → publish with `--tag next`. README carries pre-release banner.
- **`@foliokit/cms-admin-ui` dist-tag issue:** `latest` points to an older version; current version is on `next`. Fix: `npm dist-tag add @foliokit/cms-admin-ui@<version> latest` (must be run locally).
- Additive-only changes on public interfaces — never drop existing exported fields.

---

## Timestamp Safety

Always guard `.toMillis()` calls on Firestore timestamps. Double-conversion produces year-2098 bugs:

```typescript
// Safe
const ms = timestamp instanceof Timestamp ? timestamp.toMillis() : timestamp;

// Never
const ms = someValue.toMillis().toMillis(); // year 2098
```

---

## What Not To Touch

- `firebase.json` and `.firebaserc` — Doug manages deployment config manually.
- `@angular/fire` — not used, not a dependency, never add it.
- `*ngIf` / `*ngFor` — use `@if` / `@for`.
- SCSS variables as the token system — CSS custom properties only.
- `isPlatformBrowser()` guards around server-renderable content.
- `/sites/{siteId}/` Firestore paths — deprecated, use `/tenants/{tenantId}/`.
- Hardcoded collection path strings — use `collectionPaths()` factory.
- `release-please` — Nx Release is in use; `release-please` is likely redundant.

---

## Phase 11 Context (Multi-Tenancy SaaS)

Phase 11 is active. Three-commit migration sequence:

- **Commit 1 ✅** — `TenantConfig`/`BillingRecord` interfaces, `collectionPaths()` factory, `TENANT_COLLECTION_PREFIX` token in `cms-core`.
- **Commit 2 ✅** — Rename `sites/{siteId}/` → `tenants/{tenantId}/` throughout `collection-paths.ts` and specs.
- **Commit 3 (pending)** — Migration script in `tools/migrations/`. Three open questions: environment targeting, Firebase Admin SDK auth strategy, `--dry-run` support.

Tenant resolution: Express middleware in `server.ts`, `Host` header with short TTL cache, injected via DI token, read synchronously by `APP_INITIALIZER`. `customDomain` field handles non-subdomain domains.

`blog.foliokitcms.com` is live on `foliokit-prod` but Firestore data hasn't been migrated to `/tenants/{tenantId}/` yet.

---

## Output Format for Implementation Prompts

When generating Cursor/Claude Code implementation prompts, structure them as:

1. **Scope** — single concern, one commit
2. **Pre-flight reads** — exact file paths to read before writing
3. **File edits** — targeted diffs, not full-file rewrites
4. **Constraints** — explicit list of what not to touch
5. **Out-of-scope** — what belongs in a future commit
6. **Validation steps** — how to verify the change is correct

Plain unformatted text blocks when copy-paste into Cursor is the intent. No markdown headers inside the prompt body.