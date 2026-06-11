# Blog → RhombusKit styling cleanup — design

- **Date:** 2026-06-11
- **Status:** Draft — pending user review
- **Scope:** `apps/blog` and the blog-facing components in `libs/cms-ui`
- **Goal:** Reduce the blog app's hand-rolled styling/scaffolding so each page resembles the
  RhombusKit (`@rhombuskit/*` 0.11.0) components and design-token contract it already depends on,
  while keeping FolioKit's teal brand and all link/SEO semantics intact.

---

## 1. Context & guiding principles

The blog wraps the RhombusKit shell and uses RhombusKit in only three places: the **app shell**,
the **chip filter group** on the post list, and a single **button** ("Show all"). Almost everything
else — Home CTAs, About social links, Links-page rows, post-card tag pills, series cards, the share
menu — is bespoke HTML + CSS that imitates components RhombusKit (or the Material primitives it
wraps) could provide.

"Resemble RhombusKit" means, in priority order:

1. **Use a RhombusKit component where the *semantics* match** (selection chips, true buttons, theme menu).
2. **Theme only through the token contract** (`--btn-primary-*`, `--nav-active-*`, `--text-*`,
   `--surface-*`, `--status-*`), keeping the **teal** brand. The chips render teal (not RhombusKit's
   stock purple) because FolioKit rebrands via tokens — that is the correct idiom; keep it.
3. **Delete per-element CSS that re-implements what a component or token already provides.**
4. **Keep genuinely blog-specific composites**: hero image card, series TOC nav, markdown prose.

## 2. Constraints discovered during analysis (ground truth)

These shaped the plan and must be respected:

- **`<rhombus-button>` is button-only.** Selector is `rhombus-button`; template renders
  `<button [matButton]=…>`. It is **not** an anchor. Most blog "buttons" are *navigations*
  (`routerLink` / external `href`), so a naive swap would break middle-click, open-in-new-tab and SEO.
  → Navigational "buttons" use **Material's anchor button `a[matButton]`**, themed by the same
  `material-preset` `--mat-sys-*` bridge that `rhombus-button` wraps. Visually identical, link semantics preserved.
- **`rhombus-chip` is a *selection* directive** on `mat-chip-option` (correct for the filter listbox,
  which already uses it). **`rhombus-badge` is an *overlay* indicator** (matBadge). Neither is a clean
  fit for a standalone clickable tag-pill → those stay anchors, restyled to the chip token look.
- **Both blog and admin self-host the Material Icons ligature font** (`material-icons.css` in each
  `project.json` build styles), and `cms-ui` registers SVG literals via `provide-cms-ui-mat-icons.ts`.
  So `rhombus-icon` / `mat-icon` ligatures (`leadingIcon`, `rhombus-theme-menu`) render correctly.
- **`rhombus-theme-menu`'s trigger glyph reflects the user's *preference*** (light/dark/system via
  `theme.preference()`) — matching the current control's UX, not the resolved theme.
- **`folio-theme-control` is shared by three shells**: blog (`app-shell.component.html`), admin
  (`admin-shell.component.ts`), docs (`docs-shell.component.html`). Replacing it in the **blog shell
  only** contains blast radius to the blog; the component is **not deleted** (admin/docs still use it).

## 3. Decisions (from review)

- **Navigational buttons** → Material anchor buttons (`a[matButton]`).
- **Theme menu** → adopt the real `<rhombus-theme-menu>` (blog shell only).
- **Deliverable** → this spec, then a step-by-step implementation plan. Shared `cms-ui` changes allowed.

---

## 4. The three reported symptoms

### 4.1 Sidenav selected item misaligned — `apps/blog/src/app/app.ts:85`
**Cause:** inactive `.nav-item` is full-width (`padding: 0 16px`); `.active-link` adds
`margin: 1px 8px`, insetting the active pill 8px/side (label shifts ~8px right) plus a 1px vertical nudge.
**Fix:** remove `margin: 1px 8px`. Apply a uniform horizontal inset + transparent `border-radius` to
*all* nav items so the active background fills the same box, pixel-aligned with inactive/hover. Keep
`--nav-active-bg` / `--nav-active-text` (already the RhombusKit-idiomatic active treatment).
**Blast radius:** blog only.

### 4.2 "Checkbox" beside selected theme — `libs/cms-ui/.../theme-control.component.ts:80`
**Cause:** not a Material artifact — `folio-theme-control` deliberately draws its own checkmark SVG
(`.folio-theme-check`). RhombusKit's `<rhombus-theme-menu>` marks the active item with accent label
text, no checkmark.
**Fix (decision: adopt the component):** in `app-shell.component.html`, replace `<folio-theme-control />`
with `<rhombus-theme-menu />`; add `RhombusThemeMenuComponent` to `AppShellComponent` imports, drop the
`FolioThemeControlComponent` import there. Optionally set `systemIcon` to taste (default `contrast`).
`provideFolioKitTheme()` already supplies `RHOMBUS_THEME_CONFIG`. Verify icons render and the trigger
reflects preference.
**Blast radius:** blog shell only; `folio-theme-control` stays for admin/docs.

### 4.3 Unreadable "Show all (26)" — `libs/cms-ui/.../blog-tag-filter.component.ts:48`
**Cause:** a `<rhombus-button appearance="text" variant="secondary">` (a *button*) sitting in a row of
*chips*; the secondary-text color resolves to a low-contrast value, and it's stylistically the odd one out.
**Fix:** switch to a readable variant — `variant="primary"` text (uses `--text-accent`) — verifying
actual contrast in the live preview; fall back to folding "Show all / Show less" into the chip group as
a trailing chip if button-in-chip-row still reads inconsistent.
**Blast radius:** shared component, blog-facing.

---

## 5. Per-page conversion inventory

For each: current → action → CSS removed. Anchors that navigate stay anchors (`a[matButton]` or trimmed).

### 5.1 Shell nav — `apps/blog/src/app/app.ts`
- `.nav-item` / `.active-link`: apply the 4.1 alignment fix. No RhombusKit nav component exists; keep
  the hand-rolled nav but lean fully on `--nav-active-*`. **Trim only.**

### 5.2 Home — `libs/cms-ui/src/lib/home/blog-home.component.ts`
- `.btn-primary` (anchor `routerLink`) → `a[matButton="filled"]`.
- `.btn-secondary` (anchor `routerLink`) → `a[matButton="outlined"]`.
- **Delete** `.btn-primary` / `.btn-secondary` rules (~40 lines). Match teal via the `--mat-sys-*` bridge.
- **Keep**: `.hero-eyebrow`, hero typography, `.recent-post-card`, all skeleton styles (blog-specific).

### 5.3 Post card — `libs/cms-ui/src/lib/post-list/blog-post-card.component.ts`
- `.chip` / `.chip--primary` tag-pills are **anchors with `queryParams`** → keep as anchors; restyle to
  the RhombusKit chip token look (drop the bespoke `--teal-50` / `rgba(42,151,151,…)` literals and the
  inline `style="position:relative;z-index:20"`; use contract tokens). Consider extracting one shared
  `.folio-tag-pill` rule reused by the card chips and hero chips.
- **Keep**: `.hero-card`, `.hero-thumb*`, `.hero-gradient`, `.hero-chip`, `.hero-title/.hero-meta`
  (image-overlay composite). Note `--hero-*` are flagged deprecated brand tokens → §6.

### 5.4 Series list — `libs/cms-ui/src/lib/series/series-list.component.ts`
- Worst offender: the card uses **inline `onmouseenter`/`onmouseleave` JS** + inline `style=` for hover.
  → Replace with a proper component using CSS hover (or `rhombus-card` if it supports a link/clickable
  mode — verify). Move inline styles into the component's `styles`.
- "N posts" stays text (or a small token-styled count). **Delete** inline JS + inline styles.

### 5.5 About — `libs/cms-ui/src/lib/about-page/about-page.component.ts`
- `.social-link` (anchor, external `href`, `mat-icon svgIcon="link"`) → `a[matButton="outlined"]` with
  `leadingIcon` (ligature) or projected `mat-icon`. **Delete** `.social-link` (~25 lines). Keep container/layout.

### 5.6 Links — `libs/cms-ui/src/lib/links-page/links-page.component.ts`
- `.link-btn` (anchor, external `href`, icon + label + chevron) → full-width `a[matButton="outlined"]`
  with `leadingIcon` (platform icon) + `trailingIcon="chevron_right"`. **Delete** `.link-btn` and its
  nested rules (~50 lines). Biggest single CSS deletion.

### 5.7 Post detail — `libs/cms-ui/src/lib/post-detail/blog-post-detail.component.ts` + `series-nav.component.ts`
- `.share-menu-panel` (hand-rolled popover) → `mat-menu` (the M3 primitive RhombusKit menus build on).
- `.series-eyebrow-link` pill → token-aligned (reuse `.folio-tag-pill` look).
- **Keep**: series TOC nav (composite) and `.folio-prose`. *(Large file; read in full at implementation.)*

---

## 6. Shared / global cleanup
- `_tokens.scss`: confirm `--hero-*` "deprecated brand tokens" are consumed only by the hero card; fold
  into the contract or remove.
- `index.scss` bridges (error tokens, form-field width) → **keep** (necessary scoping fixes).
- After conversions, sweep for any custom CSS now duplicated by adopted primitives and delete it.

## 7. Empty bordered box on Series page (2nd screenshot)
Sits below "Powered by FolioKit" (`app-shell.component.html:56`). Root cause depends on rendered layout;
**diagnose live in the blog preview (port 4201, public)** and remove the stray empty/bordered element.

## 8. Sequencing (small, independently verifiable changes)
1. Three reported fixes (nav align, theme menu adopt, Show-all contrast).
2. Links + About → anchor buttons (largest CSS deletion, lowest risk).
3. Series list → componentized card (kill inline JS).
4. Home CTAs → anchor buttons.
5. Post-card tag pills + `--hero-*` token audit.
6. Post detail (share menu + eyebrow).
7. Global token/CSS sweep + empty-footer fix.

## 9. Verification strategy
- Each change verified in the **blog preview** (port 4201, public — no auth guard): visual screenshot,
  console/network clean, theme toggle light+dark.
- Shared `cms-ui` changes additionally checked via the **admin build** (admin preview is auth/TTY-blocked).
- Confirm `a[matButton]` anchor support in the installed Angular Material (21.x unified `matButton` API).

## 10. Verify-at-implementation items
- Exact low-contrast token behind "Show all" (confirm chosen variant passes contrast in both themes).
- `rhombus-card` link/clickable capability (else CSS-hover anchor for series cards).
- `rhombus-theme-menu` icon rendering + preference-reflecting trigger in the blog shell.
- `a[matButton]` parity with `rhombus-button` look (variant/appearance mapping to teal via bridge).

## 11. Out of scope
- Admin and docs shells' theme control (stay on `folio-theme-control`).
- Purple→teal rebrand (already correct via tokens).
- Functional/behavioral changes beyond styling and the empty-footer fix.
- RhombusKit version bump.
