# folio-app-shell: Harden or Retire — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve the fate of `folio-app-shell` (`AppShellComponent`) now that blog — the last app consumer — has moved directly onto `@rhombuskit/core`'s `rhombus-app-shell` (PR #226, merged).

**Architecture:** Two candidate paths. **Path A (recommended): harden + keep** `folio-app-shell` as FolioKit's branded convenience shell — add `hasNav`/`frame` passthrough and fix drifted `ShellConfig.nav` usage; non-breaking, ~2 tasks. **Path B: retire + delete** `folio-app-shell`, standardize every consumer on raw `rhombus-app-shell`; breaking `@foliokit/cms-ui` major, docs-section rewrite, sample-app churn, ~9 tasks. Pick one before executing.

**Tech Stack:** Angular 21 (standalone, OnPush, `@if/@for`), Nx monorepo, `@rhombuskit/core@1.9.0`, NgRx signals, vitest, release-please.

---

## ⚠️ Decision gate (read before executing)

The original brief listed "folio-app-shell deletion" as the downstream endgame, and option B (blog-direct) was chosen with deletion as the assumed finish. Recon since then surfaced three facts that weren't fully weighed at that point:

1. **Going direct re-introduces the boilerplate the wrapper exists to remove.** Blog's own migration added **+129 lines** to `app.ts` (hand-wiring brand + theme menu + powered-by footer + `hasNav` signal + re-homed styles). The `starter-template` — the app users literally copy to start — would inherit that verbosity. A convenience shell is a FolioKit DX feature, not dead weight.
2. **`SHELL_CONFIG` is entangled with the core bootstrapper.** `providesFolioKit({ shell })` provides `SHELL_CONFIG` ([provide-folio-kit.ts:53-54,160-162](../../../libs/cms-core/src/lib/provide-folio-kit.ts)). Deleting the shell strands the token; deleting the token too pushes the breaking change into `providesFolioKit`'s public options.
3. **Blog went direct for a blog-specific reason** — it's the only `RenderMode.Server` app and needed per-route `hasNav`. That justifies blog going direct; it is *not* evidence the wrapper is bad. The wrapper simply lacked a `hasNav` passthrough — which Path A adds.

**Recommendation: Path A (harden + keep).** Keep `folio-app-shell` as the public branded shell, give it `hasNav`/`frame` passthrough so it stays feature-complete with `rhombus-app-shell`, and fix the drifted `nav:` usage in the samples/docs. Non-breaking, tiny, preserves DX. Blog can stay direct (its SSR `hasNav` logic is legitimately blog-specific) or optionally move back onto the hardened wrapper later.

Path B is fully specified below in case you still want to standardize on raw `rhombus-app-shell` and thin FolioKit's surface — but it is the larger, breaking, editorial-heavy option, and I'd only take it if the explicit goal is "FolioKit no longer ships a branded shell."

---

## Global Constraints

- Standalone components only; no NgModules.
- `ChangeDetectionStrategy.OnPush` everywhere.
- `@if`/`@for`/`@switch` control flow — never `*ngIf`/`*ngFor`.
- Prettier `singleQuote: true`.
- `string | null` for nullable fields (never `undefined`).
- Nx module boundaries: `cms-admin-ui`/`cms-ui` may depend on `cms-core`, never the reverse.
- `@rhombuskit/core` is pinned `1.9.0` (lockstep with the other `@rhombuskit/*`). `rhombus-app-shell` already exposes `hasNav` (default `true`), `frame` (`'fill'|'phone'`), `navMode`, `iconRail`, `mobileBreakpoint`, `closeOnNavigate`, and the `--rhombus-app-shell-sidenav-width` (220px) custom property. No RhombusKit change is required by either path.
- Conventional commits: `feat(scope):` / `fix(scope):` / `refactor(scope):`; breaking changes use a `BREAKING CHANGE:` footer (release-please is wired).

---

## Current-state consumer map (as of merged #226)

**In-repo, CI-built (nx projects):**
- `libs/cms-ui` — **defines** `AppShellComponent` (`folio-app-shell`), `ShellNavFooterDirective`, and re-exports `SHELL_CONFIG`/`ShellConfig`. Exported from `libs/cms-ui/src/index.ts:1-2,4`.
- `libs/cms-core` — **defines** `SHELL_CONFIG`/`ShellConfig` ([tokens/shell-config.token.ts](../../../libs/cms-core/src/lib/tokens/shell-config.token.ts)); `providesFolioKit({ shell })` provides it.
- `apps/docs` — **only in-repo runtime consumer of `folio-app-shell`:** two live preview components render `<folio-app-shell />` ([shell-config-token-page.component.ts:15,17](../../../apps/docs/src/app/pages/tokens/shell-config-token-page.component.ts), [app-shell-examples-page.component.ts:50-64](../../../apps/docs/src/app/pages/app-shell/app-shell-examples-page.component.ts)); ~5 pages teach it in prose/string samples; `docs-route-manifest.ts` + `docs-page-meta.resolver.ts` define its nav/metadata.
- `libs/cms-admin-ui` — `admin-shell` **provides** `SHELL_CONFIG` via factory but consumes `rhombus-app-shell` directly; does **not** use `folio-app-shell`. (Gate A/B — do not reopen.)
- `apps/blog` — migrated (#226); still *provides* an orphaned `SHELL_CONFIG` (harmless).

**Standalone Angular CLI projects (NOT nx; build against *published* `@foliokit/*`):**
- `demo/`, `smoke-test/`, `tools/starter-template/` — each imports `AppShellComponent` and provides `SHELL_CONFIG` with a **defunct `nav:` array** (the `nav` field was removed from `ShellConfig`; these are drifted and clearly not CI-built). Deleting `folio-app-shell` in the monorepo does **not** break their current builds — they resolve `@foliokit/cms-ui` from npm. They are a **post-release** reconciliation.

---

# PATH A (recommended): Harden + keep `folio-app-shell`

## Task A1: Add `hasNav`/`frame` passthrough to `folio-app-shell`

**Files:**
- Modify: `libs/cms-ui/src/lib/app-shell/app-shell.component.ts`
- Modify: `libs/cms-ui/src/lib/app-shell/app-shell.component.html:1-4`
- Test: `libs/cms-ui/src/lib/app-shell/app-shell.component.spec.ts` (create)

**Interfaces:**
- Produces: `AppShellComponent` gains two inputs — `hasNav = input(true)` and `frame = input<'fill' | 'phone'>('fill')` — forwarded to `rhombus-app-shell`.

- [ ] **Step 1: Write the failing test**

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { AppShellComponent } from './app-shell.component';
import { SHELL_CONFIG } from '../shell-config.token';

describe('AppShellComponent hasNav', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (q: string) => ({ matches: false, media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false }),
    });
  });

  function render(hasNav: boolean) {
    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SHELL_CONFIG, useValue: signal({ appName: 'T' }) },
      ],
    });
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('hasNav', hasNav);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the drawer when hasNav is true and omits it when false', () => {
    expect(render(true).nativeElement.querySelector('mat-sidenav')).not.toBeNull();
    TestBed.resetTestingModule();
    expect(render(false).nativeElement.querySelector('mat-sidenav')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx nx test cms-ui -- app-shell.component.spec`
Expected: FAIL — `hasNav` is not an input of `AppShellComponent` yet (setInput throws / drawer always present).

- [ ] **Step 3: Add the inputs and forward them**

In `app-shell.component.ts`, add to the imports from `@angular/core`: `input`. Inside the class:

```ts
  /** Forwarded to rhombus-app-shell: false renders bare routes with no nav drawer. */
  readonly hasNav = input(true);
  /** Forwarded to rhombus-app-shell: 'phone' centers content at a phone width. */
  readonly frame = input<'fill' | 'phone'>('fill');
```

In `app-shell.component.html`, change the opening tag (lines 1-4):

```html
<rhombus-app-shell
  [mobileBreakpoint]="sidenavMobileMaxPx()"
  [closeOnNavigate]="true"
  [hasNav]="hasNav()"
  [frame]="frame()"
>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx nx test cms-ui -- app-shell.component.spec`
Expected: PASS.

- [ ] **Step 5: Build the library**

Run: `npx nx build cms-ui`
Expected: green.

- [ ] **Step 6: Commit**

```bash
git add libs/cms-ui/src/lib/app-shell/app-shell.component.ts libs/cms-ui/src/lib/app-shell/app-shell.component.html libs/cms-ui/src/lib/app-shell/app-shell.component.spec.ts
git commit -m "feat(cms-ui): add hasNav/frame passthrough to folio-app-shell"
```

## Task A2: Fix drifted `ShellConfig.nav` usage in samples + docs

**Files:**
- Modify: `demo/src/app/app.ts:38-39`, `demo/src/app/app.config.ts:33-45`
- Modify: `smoke-test/src/app/app.config.ts:33-40`
- Modify: `tools/starter-template/src/app/app.component.ts:27-36`
- Modify: `apps/docs/src/app/pages/app-shell/app-shell-examples-page.component.ts`, `apps/docs/src/app/pages/tokens/shell-config-token-page.component.ts` (string samples only — no `nav:` there today; verify)

**Rationale:** `ShellConfig` has no `nav` field. Samples pass `nav:` in a `ShellConfig` object (excess property / would be TS2353 if these were CI-built) and read `config.nav`. Move nav into the projected `[shellNav]` slot (the supported API). Because these are the *branded-wrapper* path, they keep using `folio-app-shell` — just correct the config.

- [ ] **Step 1: Fix `demo/src/app/app.config.ts`** — drop `nav:` from the `SHELL_CONFIG` object:

```ts
    {
      provide: SHELL_CONFIG,
      useValue: signal<ShellConfig>({
        appName: 'Stark Industries Lab Notes',
        showAuth: false,
      }),
    },
```
Add `import { signal } from '@angular/core';` and `import type { ShellConfig } from '@foliokit/cms-ui';` if missing. (`SHELL_CONFIG` expects `Signal<ShellConfig>` — wrapping in `signal()` also fixes a latent bug.)

- [ ] **Step 2: Fix `demo/src/app/app.ts`** — source nav locally instead of `config.nav`:

```ts
  // was: readonly navItems = this.config.nav ?? [];
  readonly navItems = [
    { label: 'Home', url: '/' },
    { label: 'Lab Notes', url: '/blog' },
    { label: 'About', url: '/about' },
    { label: 'Links', url: '/links' },
  ];
```
Remove the now-unused `inject(SHELL_CONFIG)` if nothing else reads it.

- [ ] **Step 3: Fix `smoke-test/src/app/app.config.ts`** — drop `nav: []`:

```ts
    {
      provide: SHELL_CONFIG,
      useValue: signal<ShellConfig>({ appName: 'FolioKit Smoke Test', showAuth: false }),
    },
```
(add the same `signal` / `ShellConfig` imports).

- [ ] **Step 4: Fix `tools/starter-template/src/app/app.component.ts`** — drop `nav: DEFAULT_NAV` from the provided `ShellConfig`; keep `DEFAULT_NAV` for `navItems` (already projected via `[shellNav]` in the html):

```ts
      useFactory: (): ShellConfig => ({
        appName: 'My Blog',
        showAuth: false,
      }),
```

- [ ] **Step 5: Verify no `ShellConfig` object still carries `nav`**

Run: `rg -n "nav:" demo smoke-test tools/starter-template apps/docs/src/app/pages/app-shell apps/docs/src/app/pages/tokens | rg -v "shellNav|navItems|navSections|navCode|navMode"`
Expected: no matches inside `ShellConfig`/`SHELL_CONFIG` objects.

- [ ] **Step 6: Build the CI-gated projects**

Run: `npx nx build docs && npx nx build cms-ui`
Expected: both green. (The standalone `demo`/`smoke-test`/`starter-template` are validated with their own `npm ci && npm run build` — run if network/published packages allow; otherwise note as manual.)

- [ ] **Step 7: Commit**

```bash
git add demo/src/app/app.ts demo/src/app/app.config.ts smoke-test/src/app/app.config.ts tools/starter-template/src/app/app.component.ts
git commit -m "fix(samples): drop removed ShellConfig.nav; project nav via [shellNav]"
```

**Path A stops here.** `folio-app-shell` stays; it now matches `rhombus-app-shell`'s no-nav capability; nothing breaks; no release gymnastics.

---

# PATH B: Retire + delete `folio-app-shell`

> Only execute Path B if the decision gate resolved to "standardize on raw rhombus-app-shell / FolioKit ships no branded shell." Phases 1-2 (docs migration) and Phase 3 (delete) are in-repo and CI-gated; Phase 6 (samples) is post-release.

**Canonical replacement pattern** (teach this everywhere `folio-app-shell` was taught):

```ts
import { RhombusAppShellComponent, RhombusThemeMenuComponent, RhombusNavListComponent } from '@rhombuskit/core';
// template:
`<rhombus-app-shell>
  <a shellBrand routerLink="/">My App</a>
  <rhombus-theme-menu shellHeaderActions />
  <nav shellNav>
    <rhombus-nav-list ariaLabel="Main" [sections]="navSections" />
  </nav>
  <router-outlet />
</rhombus-app-shell>`
```

## Task B1: Migrate the two live docs preview components

**Files:**
- Modify: `apps/docs/src/app/pages/tokens/shell-config-token-page.component.ts:1-19`
- Modify: `apps/docs/src/app/pages/app-shell/app-shell-examples-page.component.ts:1-64`

**Interfaces:**
- Consumes: `RhombusAppShellComponent` from `@rhombuskit/core`.
- Produces: preview components no longer import `AppShellComponent`/`SHELL_CONFIG`.

- [ ] **Step 1: Rewrite `ShellConfigPreviewComponent`** in `shell-config-token-page.component.ts`:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsPreviewComponent } from '@foliokit/docs-ui';
import { RhombusAppShellComponent, RhombusCodeBlockComponent } from '@rhombuskit/core';

@Component({
  selector: 'docs-shell-config-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusAppShellComponent],
  template: `<rhombus-app-shell><a shellBrand routerLink="/">FolioKit Blog</a><router-outlet /></rhombus-app-shell>`,
})
class ShellConfigPreviewComponent {}
```
(Delete the `previewConfig`/`SHELL_CONFIG` provider. This page is being repurposed by Task B2 — but make it compile first.)

- [ ] **Step 2: Rewrite both previews** in `app-shell-examples-page.component.ts` to `rhombus-app-shell` (drop `AppShellComponent`, `SHELL_CONFIG`, `ShellConfig`, `basicConfig`, `authConfig`); auth slot example uses `[shellAuthSlot]`.

- [ ] **Step 3: Build docs**

Run: `npx nx build docs`
Expected: green.

- [ ] **Step 4: Verify no live `folio-app-shell` render remains in docs components**

Run: `rg -n "folio-app-shell|AppShellComponent" apps/docs/src --glob '!**/*.ts' ; rg -n "imports:\s*\[[^]]*AppShellComponent" apps/docs/src`
Expected: no component `imports:` still list `AppShellComponent` (string samples handled in B2).

- [ ] **Step 5: Commit**

```bash
git add apps/docs/src/app/pages/tokens/shell-config-token-page.component.ts apps/docs/src/app/pages/app-shell/app-shell-examples-page.component.ts
git commit -m "refactor(docs): move app-shell live previews onto rhombus-app-shell"
```

## Task B2: Rewrite the App-Shell docs content

**Files:**
- Modify: `apps/docs/src/app/pages/app-shell/app-shell-overview-page.component.ts` (string samples + prose)
- Modify: `apps/docs/src/app/pages/app-shell/app-shell-api-page.component.ts`
- Modify: `apps/docs/src/app/pages/app-shell/app-shell-theming-page.component.ts`
- Modify: `apps/docs/src/app/pages/getting-started/getting-started-page.component.ts` (`shellComponentCode`, `app-config` sample, prose)
- Modify: `apps/docs/src/app/pages/tokens/tokens-overview-page.component.ts` (prose refs at :62,:108)
- Modify: `apps/docs/src/app/pages/tokens/shell-config-token-page.component.ts` (string samples `basicShellCode`/`navCode`/`usageCode`)
- Modify: `apps/docs/src/app/docs-route-manifest.ts:12-21`, `apps/docs/src/app/resolvers/docs-page-meta.resolver.ts:27-59`

**Decision inside this task:** the "AppShell" section documented a FolioKit component that no longer exists. Choose one:
- **(i)** Repoint the section to teach the canonical raw `rhombus-app-shell` composition (samples above) and cross-link RhombusKit's own docs (`https://rhombuskit.online/components/app-shell`). Keep the routes.
- **(ii)** Collapse the section to a single "Layout" page that defers to RhombusKit, and delete the `/api` `/theming` `/examples` children from the manifest + meta + routes.

Recommended: **(i)** — keeps deep links alive.

- [ ] **Step 1:** Replace every `folio-app-shell` string sample across the listed files with the canonical `rhombus-app-shell` pattern; replace prose "`AppShellComponent` (`folio-app-shell`)" with "FolioKit composes RhombusKit's `rhombus-app-shell`".
- [ ] **Step 2:** Update `docs-route-manifest.ts` label `'AppShell'` → `'App Layout'` (keep `path: '/docs/app-shell'`); update `docs-page-meta.resolver.ts` `app-shell*` titles/descriptions/headings to match (drop `SHELL_CONFIG` heading in `app-shell/api`).
- [ ] **Step 3: Build + grep**

Run: `npx nx build docs && rg -n "folio-app-shell" apps/docs/src`
Expected: build green; zero `folio-app-shell` matches.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src
git commit -m "docs: teach rhombus-app-shell; retire folio-app-shell content"
```

## Task B3: Delete `folio-app-shell` + `ShellNavFooterDirective`; update exports

**Files:**
- Delete: `libs/cms-ui/src/lib/app-shell/app-shell.component.ts`, `.html`, `.scss`
- Delete: `libs/cms-ui/src/lib/app-shell/shell-nav-footer.directive.ts`
- Modify: `libs/cms-ui/src/index.ts:1-2` (remove both export lines)
- Modify: `libs/cms-ui/README.md` (remove `folio-app-shell` usage section)

- [ ] **Step 1:** Delete the four files and remove `libs/cms-ui/src/index.ts` lines 1-2:
```
export * from './lib/app-shell/app-shell.component';
export * from './lib/app-shell/shell-nav-footer.directive';
```
- [ ] **Step 2: Verify nothing in-repo still imports them**

Run: `rg -n "AppShellComponent|ShellNavFooterDirective|folio-app-shell" libs apps` (exclude the deleted paths)
Expected: zero matches (admin uses `RhombusShellNavFooterDirective`, not the folio one — confirm the hits are only that Rhombus name).

- [ ] **Step 3: Build + test the library and docs**

Run: `npx nx build cms-ui && npx nx test cms-ui && npx nx build docs && npx nx build blog`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add -A libs/cms-ui/src/lib/app-shell libs/cms-ui/src/index.ts libs/cms-ui/README.md
git commit -m "feat(cms-ui)!: remove folio-app-shell in favor of rhombus-app-shell

BREAKING CHANGE: AppShellComponent (folio-app-shell) and ShellNavFooterDirective
are removed from @foliokit/cms-ui. Compose @rhombuskit/core's rhombus-app-shell
directly (see App Layout docs)."
```

## Task B4: Deprecate `SHELL_CONFIG`/`ShellConfig` (do not delete yet)

**Files:**
- Modify: `libs/cms-core/src/lib/tokens/shell-config.token.ts`

**Rationale:** `SHELL_CONFIG` now has no consumer, but it is woven into `providesFolioKit({ shell })`'s public options. Removing it is a separate, deeper breaking change to the core provider — out of scope here. Mark deprecated so consumers get a signal; schedule removal for a later major.

- [ ] **Step 1:** Add JSDoc `@deprecated` to the `ShellConfig` interface and `SHELL_CONFIG` token:
```ts
/** @deprecated folio-app-shell was removed; compose rhombus-app-shell directly. Slated for removal in the next major. */
export const SHELL_CONFIG = new InjectionToken<Signal<ShellConfig>>('SHELL_CONFIG');
```
- [ ] **Step 2: Build core**

Run: `npx nx build cms-core`
Expected: green.

- [ ] **Step 3: Commit**

```bash
git add libs/cms-core/src/lib/tokens/shell-config.token.ts
git commit -m "refactor(cms-core): deprecate SHELL_CONFIG/ShellConfig (folio-app-shell removed)"
```

## Task B5: Full verification sweep + PR

- [ ] **Step 1:** `npx nx run-many -t build -p cms-ui,cms-core,docs,blog` → all green.
- [ ] **Step 2:** `npx nx run-many -t test -p cms-ui,blog` → all green.
- [ ] **Step 3:** `npx nx lint blog` clean; confirm docs/cms-core lint has no *new* errors vs. the pre-existing baseline (module-boundary tags, `docs-*` selectors, `loadUi()` `@ts-ignore`/circular-dep).
- [ ] **Step 4:** Live check: `docs` served, App Layout page renders the rhombus previews light + dark. Blog unaffected (already merged).
- [ ] **Step 5:** Open PR titled `feat(cms-ui)!: remove folio-app-shell`, body noting the BREAKING CHANGE, the `SHELL_CONFIG` deprecation, and that standalone samples migrate post-release (Task B6).

## Task B6 (POST-RELEASE, gated): migrate standalone sample apps

**Gated on:** a published `@foliokit/cms-ui` without `folio-app-shell`. These CLI apps resolve `@foliokit/*` from npm, so do this only after the release from B5 is published; otherwise their `npm run build` still sees the old component.

**Files:** `demo/src/app/app.ts` + `app.config.ts`, `smoke-test/src/app/app.ts` + `app.config.ts`, `tools/starter-template/src/app/app.component.ts` + `.html`.

- [ ] **Step 1:** Bump each project's `@foliokit/*` to the new published version.
- [ ] **Step 2:** Replace `<folio-app-shell>` with the canonical `rhombus-app-shell` pattern; remove `SHELL_CONFIG` providers (and the drifted `nav:` arrays); source nav locally into `[shellNav]`.
- [ ] **Step 3:** In each project dir: `npm ci && npm run build` → green.
- [ ] **Step 4:** Commit per project: `refactor(demo|smoke-test|starter-template): move onto rhombus-app-shell`.

---

## Self-Review

- **Spec coverage:** Path A closes the no-nav gap on the wrapper (A1) and the drifted-config bug (A2). Path B covers every in-repo consumer (B1 previews, B2 content, B3 delete+exports), the token entanglement (B4 deprecate, not delete), verification/release (B5), and the standalone samples (B6, correctly gated post-release). Admin is untouched (uses `RhombusShellNavFooterDirective`, not the folio directive).
- **Type consistency:** `hasNav`/`frame` signatures in A1 match `rhombus-app-shell`'s (`input(true)`, `input<'fill'|'phone'>('fill')`). `SHELL_CONFIG` remains `InjectionToken<Signal<ShellConfig>>` throughout; A2/B6 wrap provided values in `signal()` to satisfy it.
- **Placeholders:** none — editorial steps in B2 name exact files, the canonical sample, and a grep gate.
