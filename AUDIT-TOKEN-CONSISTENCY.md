# FolioKit — Cross-App Token & Theme Consistency Audit

**Date:** 2026-03-29
**Scope:** `apps/blog`, `apps/admin`, `apps/docs`, `libs/cms-ui`, `libs/cms-admin-ui`, `libs/docs-ui`
**Mode:** Read-only audit — no files modified

---

## 1. Hardcoded Color Values

### apps/admin

| File | Line | Value | Context |
|------|------|-------|---------|
| `apps/admin/src/index.html` | 13 | `#F8FAFD` | Loading placeholder `background` on `<app-root>` child div |

**Suggested fix:** Replace with `var(--bg)` or `var(--surface-0)`. The placeholder renders before Angular boots, so consider an inline `<style>` block that reads the token, or accept this as a boot-screen one-off.

### libs/cms-ui

| File | Line | Value | Context |
|------|------|-------|---------|
| `libs/cms-ui/src/lib/post-list/blog-tag-filter.component.ts` | 60 | `#fff` | `.tag-chip--active` text color |
| `libs/cms-ui/src/lib/post-list/blog-tag-filter.component.ts` | 65 | `#fff` | `.tag-chip--active:hover` text color |

**Suggested fix:** Replace `#fff` with `var(--btn-primary-text)` — the active chip is semantically a primary button inverse.

### libs/cms-admin-ui

| File | Line | Value | Context |
|------|------|-------|---------|
| `libs/cms-admin-ui/src/lib/post-editor/preview/seo-preview.component.ts` | 33 | `#1a6e39` | Google SERP URL green |
| `libs/cms-admin-ui/src/lib/post-editor/preview/seo-preview.component.ts` | 38 | `#1a0dab` | Google SERP title blue |
| `libs/cms-admin-ui/src/lib/post-editor/preview/seo-preview.component.ts` | 48 | `#3c4043` | Google SERP description grey |
| `libs/cms-admin-ui/src/lib/post-editor/preview/seo-preview.component.ts` | 53 | `#e0e0e0` | OG card border |
| `libs/cms-admin-ui/src/lib/post-editor/preview/seo-preview.component.ts` | 68 | `#f1f3f4` | OG placeholder background |
| `libs/cms-admin-ui/src/lib/post-editor/preview/seo-preview.component.ts` | 75 | `#fff` | OG card body background |
| `libs/cms-admin-ui/src/lib/post-editor/preview/seo-preview.component.ts` | 79 | `#8a8a8a` | OG domain text |
| `libs/cms-admin-ui/src/lib/post-editor/preview/seo-preview.component.ts` | 86 | `#1c1e21` | OG title (Facebook grey) |
| `libs/cms-admin-ui/src/lib/post-editor/preview/seo-preview.component.ts` | 95 | `#606770` | OG description |
| `libs/cms-admin-ui/src/lib/post-editor/post-editor-cover-image.component.ts` | 65 | `rgba(0,0,0,0.45)` | Image hover overlay |
| `libs/cms-admin-ui/src/lib/post-editor/post-editor-embedded-media-item.component.ts` | 43 | `rgba(0,0,0,0.5)` | Media hover overlay |
| `libs/cms-admin-ui/src/lib/posts-list/posts-queue-column.component.ts` | 22 | `rgba(0,0,0,0.2)` | Drag preview shadow |
| `libs/cms-admin-ui/src/lib/site-config-editor/site-config-page.component.ts` | 80 | `rgba(0,0,0,0.15)` | Drag preview shadow |

**Suggested fix:** The SEO preview colors are intentional — they replicate Google SERP and Facebook OG card appearance. Acceptable as-is, but consider a `/* platform-faithful */` comment for clarity. The overlay/shadow `rgba()` values should be extracted to tokens: `--overlay-hover` and `--shadow-drag`.

### libs/docs-ui

| File | Line | Value | Context |
|------|------|-------|---------|
| `libs/docs-ui/src/lib/preview/docs-preview/docs-preview.component.scss` | 12 | `#1e1e1e` | Code pane background |
| `libs/docs-ui/src/lib/preview/docs-preview/docs-preview.component.scss` | 23 | `rgba(255,255,255,0.6)` | Copy button text |
| `libs/docs-ui/src/lib/preview/docs-preview/docs-preview.component.scss` | 26 | `rgba(255,255,255,0.9)` | Copy button hover text |
| `libs/docs-ui/src/lib/preview/docs-preview/docs-preview.component.scss` | 43 | `#d4d4d4` | Code text color |

**Suggested fix:** Replace with `var(--code-block-bg)` and `var(--code-block-text)` from `_tokens.scss` — these tokens exist specifically for always-dark code blocks. The copy button colors can derive from the code-block-text token with opacity adjustments.

### apps/docs

| File | Line | Value | Context |
|------|------|-------|---------|
| `apps/docs/src/app/pages/tokens/seo-meta-token-page.component.ts` | 26 | `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)` | Decorative gradient |
| `apps/docs/src/app/pages/tokens/seo-meta-token-page.component.ts` | 19, 40, 46, 51 | `#ccc`, `#666`, `#111`, `#666` | Fallback values in `var(..., fallback)` |

**Suggested fix:** The `var()` fallbacks are acceptable defensive coding. The gradient should use `var(--violet-500)` and `var(--violet-400)` from the palette tokens.

---

## 2. Hardcoded Spacing / Sizing

### apps/admin — `apps/admin/src/styles.scss`

| Line | Value | Context |
|------|-------|---------|
| 40 | `gap: 2px` | `.tab-strip` |
| 42 | `padding: 0 16px` | `.tab-strip` |
| 54 | `padding: 10px 12px` | `.tab-btn` |
| 78 | `max-height: calc(100vh - 180px)` | `.kanban-column-body` |
| 88 | `height: 64px` | `.page-header` |
| 89 | `padding: 0 24px` | `.page-header` |
| 96 | `gap: 12px` | `.page-header-title` |
| 102 | `gap: 8px` | `.page-header-actions` |
| 132 | `padding: 40px 24px` | `.empty-state` |
| 134 | `gap: 8px` | `.empty-state` |
| 138-140 | `width/height: 36px` | `.empty-state-icon` |
| 142 | `margin-bottom: 4px` | `.empty-state-icon` |
| 157 | `max-width: 240px` | `.empty-state-body` |
| 166 | `padding: 28px 24px` | `.page-content` |
| 172 | `padding: 24px` | `.page-content-form` |

### libs/cms-ui — `app-shell.component.scss`

| Line | Value | Context |
|------|-------|---------|
| 16 | `width: 220px` | `mat-sidenav` |
| 56 | `padding-top: 8px` | `.folio-nav-body` |
| 67-68 | `gap: 10px; padding: 16px 16px 12px` | `.folio-nav-header` |
| 80-82 | `padding: 0 16px; margin-bottom: 3px; margin-top: 18px` | `.nav-group-label` |
| 92-94 | `height: 40px; padding: 0 16px; gap: 10px` | `.nav-item` |
| 97 | `font-size: 13px` | `.nav-item` |
| 200 | `height: 56px` | `.folio-toolbar` |

### libs/docs-ui — multiple components

| File | Line | Value | Context |
|------|------|-------|---------|
| `docs-callout.component.scss` | 4-8 | `gap: 0.75rem; padding: 1rem 1.25rem; margin: 1.5rem 0` | `.docs-callout` |
| `docs-page-header.component.scss` | 3-4 | `padding-bottom: 1.5rem; margin-bottom: 2.5rem` | `.docs-page-header` |
| `docs-shell.component.scss` | 54 | `width: 260px` | `.docs-sidenav` |
| `docs-nav.component.scss` | 34-36 | `gap: 8px; padding: 0 8px; height: 40px` | `.nav-l1` |
| `docs-nav.component.scss` | 91-92 | `gap: 2px; padding: 2px 0 4px` | `.nav-l2-group` |
| `docs-nav.component.scss` | 99-100 | `gap: 8px; padding: 5px 8px 5px 24px` | `.nav-l2` |
| `docs-preview.component.scss` | 4-7 | `padding: 24px; min-height: 200px; margin-top: 16px` | `__preview-pane` |
| `docs-preview.component.scss` | 13-15 | `padding: 16px; margin-top: 16px` | `__code-pane` |

**Suggested fix:** The design system does not define spacing scale tokens (e.g. `--space-1` through `--space-12`). These hardcoded values are currently the *only* option. The recommended path is to either:
1. Define a spacing scale in `_tokens.scss` and migrate gradually, or
2. Extend `tailwind.config.js` to map tokens so Tailwind utility classes can be used.

This is incremental debt — not blocking for Phase 8.

---

## 3. Tailwind Config Alignment

**File:** `tailwind.config.js` (single root-level config, no per-app overrides)

### Findings

1. **Dark mode selector is correctly aligned:** `darkMode: ['selector', '[data-theme="dark"]']` matches the `[data-theme]` selectors in `_tokens.scss`.

2. **Theme extend is empty:** `theme: { extend: {} }` — no custom colors, spacing, fonts, or shadows are mapped to CSS custom properties. This means Tailwind utility classes like `bg-surface-0` or `text-accent` are unavailable; components must use inline `var()` references or raw CSS.

3. **No app-specific color aliases exist** — there is no shadowing or duplication risk since no custom colors are defined in Tailwind at all.

4. **No per-app configs exist** — all three apps share the single root config. This is clean.

**Suggested fix:** Extend `tailwind.config.js` to bridge the token contract:

```js
theme: {
  extend: {
    colors: {
      bg: 'var(--bg)',
      'bg-subtle': 'var(--bg-subtle)',
      surface: { 0: 'var(--surface-0)', 1: 'var(--surface-1)', 2: 'var(--surface-2)', 3: 'var(--surface-3)' },
      border: 'var(--border)',
      'text-primary': 'var(--text-primary)',
      'text-secondary': 'var(--text-secondary)',
      'text-muted': 'var(--text-muted)',
      'text-accent': 'var(--text-accent)',
      accent: 'var(--teal-500)',
    },
    fontFamily: {
      display: 'var(--font-display)',
      body: 'var(--font-body)',
      mono: 'var(--font-mono)',
    },
    boxShadow: {
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
      xl: 'var(--shadow-xl)',
    },
  },
}
```

This is a nice-to-have improvement, not a Phase 8 blocker.

---

## 4. `data-theme` Wiring

### apps/blog — PASS

- Uses `AppShellComponent` from `@foliokit/cms-ui` as root layout.
- `AppShellComponent.ngOnInit()` calls `this.theme.apply()` (line 73).
- Theme toggle button rendered in toolbar.
- `ThemeService` is `providedIn: 'root'` — no explicit provider needed.

### apps/admin — PARTIAL PASS (gap on login route)

- Authenticated routes use `AdminShellComponent`, which wraps `AppShellComponent` → `theme.apply()` fires in `ngOnInit`.
- **Issue:** The `/login` route loads `LoginComponent` *outside* the shell. `LoginComponent` does not inject `ThemeService` or call `apply()`. A user with `folio-theme: dark` in localStorage will see the login page in light mode until they navigate past login.
- `SetupComponent` (also outside the shell) injects `ThemeService` but only calls `toggle()`, never `apply()`.

**Suggested fix:** Add `inject(ThemeService).apply()` to `LoginComponent.ngOnInit()`, or use an `APP_INITIALIZER` in the admin app config to apply theme before any route renders.

### apps/docs — FAIL

- `DocsShellComponent` injects `ThemeService` (line 52) and renders a theme toggle button in the template.
- **`theme.apply()` is never called.** The `ngOnInit` method (lines 82-98) only sets up breakpoint and navigation subscriptions.
- Result: docs app always renders in light mode on load. The toggle button works (it calls `theme.toggle()` which internally calls `apply()`), but saved preference is never restored on refresh.

**Suggested fix:** Add `this.theme.apply();` to `DocsShellComponent.ngOnInit()` — same pattern as `AppShellComponent`.

---

## 5. docs-ui Boundary Check

### Token Redefinition — PASS (no duplication)

- `libs/docs-ui/` defines zero SCSS variables (`$var`).
- `libs/docs-ui/` defines zero CSS custom properties (`--var: value`).
- All docs-ui components consume tokens from `--mat-sys-*` (Angular Material system tokens, which are bridged from FolioKit tokens in `_theme.scss`).
- docs-ui does not `@use` or `@import` any cms-ui SCSS partials directly — tokens are available globally via the app-level `styles.scss` import.

### Issues Found

| File | Line | Issue |
|------|------|-------|
| `libs/docs-ui/src/lib/content/docs-code-block/docs-code-block.component.scss` | 29 | Hardcoded `font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', ui-monospace, monospace` — should use `var(--font-mono)` |
| `libs/docs-ui/src/lib/preview/docs-preview/docs-preview.component.scss` | 32 | Same hardcoded font-family stack as above |
| `libs/docs-ui/src/lib/preview/docs-preview/docs-preview.component.scss` | 12, 23, 26, 43 | Hardcoded dark-theme colors (`#1e1e1e`, `rgba(255,255,255,*)`, `#d4d4d4`) — should use `var(--code-block-bg)` and `var(--code-block-text)` |

**Suggested fix:**
1. Replace both font-family declarations with `font-family: var(--font-mono)`.
2. Replace `#1e1e1e` with `var(--code-block-bg)` and `#d4d4d4` with `var(--code-block-text)`.
3. Derive copy-button colors from `var(--code-block-text)` with `color-mix()` or `opacity`.

**Priority: HIGH** — these should be fixed before writing new docs-ui components in Phase 8 to establish the correct consumption pattern.

---

## 6. Global Style Imports

### Import Correctness — PASS

All three apps import the shared design system via the barrel entry point:

| App | File | Import |
|-----|------|--------|
| blog | `apps/blog/src/styles.scss:1` | `@use '../../../libs/cms-ui/src/styles/index' as folio;` |
| admin | `apps/admin/src/styles.scss:1` | `@use '../../../libs/cms-ui/src/styles/index' as folio;` |
| docs | `apps/docs/src/styles.scss:1` | `@use '../../../libs/cms-ui/src/styles/index' as folio;` |

- No duplicate imports found.
- No app imports individual partials (`_tokens.scss`, `_reset.scss`, etc.) directly.
- Each app imports exactly once.

### Additional Style Loading (project.json)

| App | Extra Styles |
|-----|-------------|
| blog | `node_modules/material-icons/iconfont/material-icons.css` (self-hosted Material Icons) |
| admin | None |
| docs | None (Material Icons loaded via CDN `<link>` in `index.html`) |

No issues here — the import chain is clean.

---

## 7. Font Loading

### Font Declaration — Consistent

All three apps inherit the same font-family tokens from `_tokens.scss`:

```scss
--font-display: 'Fraunces', Georgia, serif;
--font-body:    'Plus Jakarta Sans', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', monospace;
```

### Web Font Loading — Currently Disabled

No app loads actual web font files. Google Fonts CDN links have been removed for privacy/CSP compliance. The Fontsource self-hosted approach is documented in `_typography.scss` (lines 11-15) but not installed. All apps currently fall back to system fonts (Georgia, system-ui, monospace).

### Material Icons — Inconsistent Strategy

| App | Strategy | Source |
|-----|----------|--------|
| blog | Self-hosted npm package | `node_modules/material-icons/iconfont/material-icons.css` |
| admin | Inlined SVG icons | `provideAdminKit()` registers SVGs at runtime |
| docs | Google Fonts CDN | `<link href="https://fonts.googleapis.com/icon?family=Material+Icons">` in `index.html` |

**Suggested fix:** The docs app should switch to the same self-hosted `material-icons` npm package used by blog, or adopt the SVG icon strategy used by admin. The CDN link introduces an external dependency and CSP risk that the other apps have already eliminated.

### Font-Family Override in docs-ui

Two docs-ui components hardcode a monospace stack that differs from the token:

| Location | Hardcoded Value | Token Value |
|----------|----------------|-------------|
| `docs-code-block.component.scss:29` | `'Fira Code', 'Cascadia Code', 'JetBrains Mono', ui-monospace, monospace` | `'JetBrains Mono', 'Fira Code', monospace` |
| `docs-preview.component.scss:32` | Same as above | Same as above |

The font priority order is reversed (Fira Code first vs JetBrains Mono first) and includes `'Cascadia Code'` and `ui-monospace` which are not in the token contract.

**Suggested fix:** Replace both with `font-family: var(--font-mono)`.

---

## Priority Summary: Top Issues Before Phase 8

### P0 — Fix Before Writing Any New Docs Components

| # | Issue | Status |
|---|-------|--------|
| 1 | **DocsShellComponent missing `theme.apply()`** | **RESOLVED** — `this.theme.apply()` added to `ngOnInit()` in `docs-shell.component.ts` |
| 2 | **docs-preview hardcoded colors** | **RESOLVED** — replaced with `var(--code-block-bg)`, `var(--code-block-text)`, and `color-mix()` in `docs-preview.component.scss` |
| 3 | **docs-ui hardcoded font-family** | **RESOLVED** — both `docs-code-block.component.scss` and `docs-preview.component.scss` now use `var(--font-mono)` |

### P1 — Fix Soon (Before Beta)

| # | Issue | Status |
|---|-------|--------|
| 4 | **Docs Material Icons via CDN** | **RESOLVED** — CDN link removed from `index.html`; self-hosted `material-icons` npm package added to `project.json` styles |
| 5 | **Admin login page missing theme init** | **RESOLVED** — `theme.apply()` added to `LoginComponent.ngOnInit()` |
| 6 | **blog-tag-filter `#fff` hardcoded** | **RESOLVED** — replaced with `var(--btn-primary-text)` |
| 7 | **Tailwind theme extend is empty** | **RESOLVED** — `tailwind.config.js` extended with colors, fontFamily, boxShadow, and borderRadius token mappings |

### P2 — Tech Debt (Address Incrementally)

| # | Issue | Impact |
|---|-------|--------|
| 8 | No spacing scale tokens in `_tokens.scss` | All spacing is hardcoded `px`/`rem` values; no systematic scale |
| 9 | Admin/cms-ui components have many hardcoded `px` spacing values | Consistent but not token-driven |
| 10 | Admin SEO preview uses platform-faithful hardcoded colors | Acceptable but undocumented — add comments |
| 11 | Overlay/shadow rgba values in cms-admin-ui not tokenized | Minor consistency issue |
| 12 | Admin `index.html` loading placeholder uses hardcoded `#F8FAFD` | Boot-screen flash doesn't respect dark mode |
