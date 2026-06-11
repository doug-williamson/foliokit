# Blog → RhombusKit Styling Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gut the blog app's hand-rolled styling/scaffolding so each page resembles the RhombusKit components and design-token contract it already uses, keeping FolioKit's teal brand and all link/SEO semantics.

**Architecture:** Replace bespoke buttons/menus with RhombusKit/Material primitives where the *semantics* match — `<rhombus-theme-menu>` for the theme control, Material anchor buttons (`a[matButton]`) for navigations, the chip group already present. Theme everything through the existing `--mat-sys-*`/`--*` token bridge (teal). Delete CSS that re-implements component chrome. Keep genuinely blog-specific composites (hero card, series TOC, prose).

**Tech Stack:** Angular 21 (standalone, OnPush, signals), Nx, Angular Material M3, `@rhombuskit/*` 0.11.0, SCSS, Tailwind 3. Spec: [docs/superpowers/specs/2026-06-11-blog-rhombuskit-cleanup-design.md](../specs/2026-06-11-blog-rhombuskit-cleanup-design.md).

---

## Conventions (read once, applies to every task)

**Branch:** all work lands on `chore/blog-rhombuskit-cleanup` (already created; the spec commit is its first commit). Each task ends in its own commit. Tasks may later be split into PRs along the same boundaries.

**Type/lint gate (run after each edit):**
```bash
npx nx lint cms-ui
npx nx build cms-ui          # ng-packagr type-check of the shared lib
```
For blog-only edits (Task 1) substitute `npx nx lint blog && npx nx build blog`.

**Visual gate — blog preview (the codebase's real safety net for presentational components):**
The blog is public on **port 4201** (no auth guard; admin's is). Use the `preview_*` tools, NOT raw `nx serve`:
1. `preview_start` if no server is running (command `npx nx serve blog`, url `http://localhost:4201` — use `localhost`, not `127.0.0.1`).
2. Navigate: `preview_eval` → `window.location.assign('http://localhost:4201<route>')` (or `window.location.reload()` if HMR already applied).
3. `preview_console_logs` → expect no new errors.
4. `preview_screenshot` in **light** then **dark** (toggle via the header theme menu, or `preview_eval` → `document.documentElement.setAttribute('data-theme','dark')`).

**Commit form (conventional + required trailer):**
```bash
git add <paths>
git commit -m "<type>(<scope>): <subject>" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

**Existing tests:** the components below have **no** unit specs (they are presentational; verified visually). `npx nx test cms-ui` exercises the theming *infrastructure* specs — run it in Task 2 (which touches the shell) and Task 9 to confirm no infra regression. Do not author new unit specs for pure-CSS tasks (matches the established pattern).

---

## File Structure (what each touched file owns)

| File | Responsibility | Tasks |
|---|---|---|
| `apps/blog/src/app/app.ts` | Blog root: nav items + nav styling | 1 |
| `libs/cms-ui/src/lib/app-shell/app-shell.component.ts` / `.html` | Shared blog shell; header actions incl. theme control | 2 |
| `libs/cms-ui/src/lib/post-list/blog-tag-filter.component.ts` | Tag filter chip row + show-all toggle | 3 |
| `libs/cms-ui/src/lib/links-page/links-page.component.ts` | Links page rows | 4 |
| `libs/cms-ui/src/lib/about-page/about-page.component.ts` | About social links | 5 |
| `libs/cms-ui/src/lib/series/series-list.component.ts` | Series cards | 6 |
| `libs/cms-ui/src/lib/home/blog-home.component.ts` | Home hero CTAs | 7 |
| `libs/cms-ui/src/lib/post-list/blog-post-card.component.ts` | Post card tag pills | 8 |
| `libs/cms-ui/src/styles/_tokens.scss`, shell HTML/SCSS | `--hero-*` audit; empty footer region | 8, 9 |

**Deferred to a follow-up plan:** `blog-post-detail.component.ts` + `series-nav.component.ts` (share menu → `mat-menu`, eyebrow pill). Reason: the file was not fully read during planning and the share-menu conversion needs the live markup. Keeping it out keeps this plan exact. See "Follow-up" at the end.

---

## Task 1: Align the active sidenav item

**Files:**
- Modify: `apps/blog/src/app/app.ts:65-93` (the `.blog-nav .nav-item` style block)

**Cause:** inactive items are full-width (`padding: 0 16px`); `.active-link` adds `margin: 1px 8px` + `border-radius: 8px`, insetting the active pill 8px/side (label shifts right) plus a 1px vertical nudge. Fix: give *all* items the same inset pill geometry; active only changes color/weight.

- [ ] **Step 1: Apply the edit.** Replace the `.blog-nav .nav-item { … }` block (lines 65–93) with:

```scss
.blog-nav .nav-item {
  position: relative;
  height: 40px;
  margin: 0 8px;
  padding: 0 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  font-family: var(--font-body);
  color: var(--text-secondary);
  text-decoration: none;
  transition:
    background 0.12s,
    color 0.12s;

  &:hover {
    background: var(--surface-2);
    color: var(--text-primary);
  }

  &.active-link {
    background: var(--nav-active-bg);
    color: var(--nav-active-text);
    font-weight: 700;
  }
}
```
(Removes `margin: 1px 8px`, `border-radius: 8px`, and `overflow: hidden` from `.active-link`; moves `margin`/`padding`/`border-radius` onto `.nav-item` so hover and active share one inset box. Net text inset stays 16px from the sidenav edge: 8px margin + 8px padding.)

- [ ] **Step 2: Type/lint gate.**
```bash
npx nx lint blog
npx nx build blog
```
Expected: both succeed.

- [ ] **Step 3: Visual gate.** Blog preview → navigate to `/series` (active = Series). Screenshot light + dark. Confirm the **active item's label is left-aligned with the inactive items'** (no 8px right shift, no vertical nudge), pill background flush with hover box. Console clean.

- [ ] **Step 4: Commit.**
```bash
git add apps/blog/src/app/app.ts
git commit -m "fix(blog): align active sidenav item with inactive nav items" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Adopt `<rhombus-theme-menu>` in the blog shell

**Files:**
- Modify: `libs/cms-ui/src/lib/app-shell/app-shell.component.ts` (imports)
- Modify: `libs/cms-ui/src/lib/app-shell/app-shell.component.html:38`

**Note:** `FolioThemeControlComponent` is still used by the admin and docs shells and stays exported from `theming/index.ts` — do **not** delete it. We only stop using it in the blog shell.

- [ ] **Step 1: Add the RhombusKit import.** In `app-shell.component.ts`, extend the existing `@rhombuskit/core` import (lines 10–13):

```ts
import {
  RhombusAppShellComponent,
  RhombusShellNavFooterDirective,
  RhombusThemeMenuComponent,
} from '@rhombuskit/core';
```

- [ ] **Step 2: Remove the old import.** Delete line 15:
```ts
import { FolioThemeControlComponent } from '../theming/theme-control/theme-control.component';
```

- [ ] **Step 3: Swap the component in `imports[]`.** In the `@Component` `imports` array (lines 40–46), replace `FolioThemeControlComponent,` with `RhombusThemeMenuComponent,`:

```ts
  imports: [
    RhombusAppShellComponent,
    RhombusShellNavFooterDirective,
    NgTemplateOutlet,
    RouterLink,
    RhombusThemeMenuComponent,
  ],
```

- [ ] **Step 4: Swap the element in the template.** In `app-shell.component.html:38`, replace:
```html
    <folio-theme-control />
```
with:
```html
    <rhombus-theme-menu />
```

- [ ] **Step 5: Type/lint/test gate.**
```bash
npx nx lint cms-ui
npx nx build cms-ui
npx nx test cms-ui
npx nx build admin   # admin uses folio-theme-control directly; confirm shared lib still compiles for it
```
Expected: all succeed.

- [ ] **Step 6: Visual gate.** Blog preview → any route. Open the header theme menu. Confirm: three options (Light/Dark/System) render **with icons** (ligature font is loaded), the active option is marked by **accent-colored text and NO checkmark**, and the trigger glyph reflects the chosen **preference** (light/dark/system). Toggle to dark and back; screenshot the open menu in both. Console clean.

- [ ] **Step 7: Commit.**
```bash
git add libs/cms-ui/src/lib/app-shell/app-shell.component.ts libs/cms-ui/src/lib/app-shell/app-shell.component.html
git commit -m "refactor(cms-ui): adopt rhombus-theme-menu in blog shell" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Make the "Show all" tag toggle readable

**Files:**
- Modify: `libs/cms-ui/src/lib/post-list/blog-tag-filter.component.ts:48-56`

**Cause:** the toggle is `<rhombus-button appearance="text" variant="secondary">`; the secondary-text color is low-contrast against the page.

- [ ] **Step 1: Apply the edit.** Change `variant="secondary"` to `variant="primary"` so the text uses `--text-accent`:

```html
      @if (tags().length > 8) {
        <rhombus-button
          appearance="text"
          variant="primary"
          size="sm"
          [attr.aria-expanded]="showAllTags()"
          (click)="showAllTags.set(!showAllTags())"
        >
          {{ showAllTags() ? 'Show less' : 'Show all (' + tags().length + ')' }}
        </rhombus-button>
      }
```

- [ ] **Step 2: Type/lint gate.**
```bash
npx nx lint cms-ui
npx nx build cms-ui
```
Expected: both succeed.

- [ ] **Step 3: Visual + contrast gate.** Blog preview → `/posts`. Confirm "Show all (N)" text is clearly readable in **light AND dark**. Use `preview_inspect` on the button text to read the resolved color and eyeball contrast against the page background. Screenshot both themes.
  - **If still low-contrast in either theme:** fall back to folding the toggle into the chip group as a trailing `<mat-chip-option rhombusChip variant="primary">` styled "Show all" pill (matches the row exactly). Re-verify.

- [ ] **Step 4: Commit.**
```bash
git add libs/cms-ui/src/lib/post-list/blog-tag-filter.component.ts
git commit -m "fix(cms-ui): make Show all tag toggle readable" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Links page rows → Material anchor buttons

**Files:**
- Modify: `libs/cms-ui/src/lib/links-page/links-page.component.ts`

**Why anchor button:** rows are external `href` navigations; `<rhombus-button>` is a `<button>` and would break link semantics. `a[matButton]` is the same M3 engine themed by the same bridge.

- [ ] **Step 1: Add `MatButtonModule` to imports.** Change line 12 + the `imports` array (line 36):
```ts
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
```
```ts
  imports: [MatIconModule, MatButtonModule, ProfileAvatarComponent],
```

- [ ] **Step 2: Convert the row template.** Replace the `<a class="link-btn" …>…</a>` block (lines 146–155) with an outlined anchor button:
```html
            <a
              matButton="outlined"
              class="link-row"
              [href]="link.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <mat-icon class="link-icon" [svgIcon]="getIcon(link)" />
              <span class="link-label">{{ link.label }}</span>
              <mat-icon class="link-chevron" svgIcon="chevron_right" />
            </a>
```

- [ ] **Step 3: Delete the bespoke chrome, keep only layout.** Replace the entire `.link-btn { … }` style block (lines 75–124) with the minimal full-width row layout (the button chrome — background, border, radius, shadow, padding, hover — now comes from `matButton`):
```scss
    .link-row {
      width: 100%;
      justify-content: flex-start;
      margin-bottom: 8px;
    }

    .link-row .link-label {
      flex: 1;
      text-align: left;
      font-weight: 500;
    }

    .link-row .link-icon {
      color: var(--text-accent);
    }

    .link-row .link-chevron {
      color: var(--text-muted);
    }
```

- [ ] **Step 4: Type/lint gate.**
```bash
npx nx lint cms-ui
npx nx build cms-ui
```
Expected: both succeed.

- [ ] **Step 5: Visual + semantics gate.** Blog preview → `/links`. Confirm rows render as full-width outlined buttons with leading platform icon, label, trailing chevron; teal accent; readable in light + dark. Use `preview_snapshot` to confirm each row is still an **`<a>` with the correct `href` and `target="_blank"`** (link semantics preserved). Note the hover changes from a translateY-lift to a Material state-layer — expected. Screenshot both themes.

- [ ] **Step 6: Commit.**
```bash
git add libs/cms-ui/src/lib/links-page/links-page.component.ts
git commit -m "refactor(cms-ui): links page rows to Material anchor buttons" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: About social links → Material anchor buttons

**Files:**
- Modify: `libs/cms-ui/src/lib/about-page/about-page.component.ts`

- [ ] **Step 1: Add `MatButtonModule` to imports.** Change line 14 + the `imports` array (line 22):
```ts
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
```
```ts
  imports: [MarkdownComponent, MatIconModule, MatButtonModule, ProfileAvatarComponent],
```

- [ ] **Step 2: Convert the link template.** Replace the `<a class="social-link" …>…</a>` block (lines 119–127) with:
```html
              <a
                matButton="outlined"
                [href]="link.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <mat-icon svgIcon="link" />
                {{ link.label || link.platform }}
              </a>
```

- [ ] **Step 3: Delete the bespoke chrome.** Remove the entire `.social-link { … }` style block (lines 62–86). Keep `.social-links` (the flex container) unchanged.

- [ ] **Step 4: Type/lint gate.**
```bash
npx nx lint cms-ui
npx nx build cms-ui
```
Expected: both succeed.

- [ ] **Step 5: Visual + semantics gate.** Blog preview → `/about`. Confirm social links render as outlined anchor buttons with the link icon; readable light + dark; `preview_snapshot` shows they remain `<a target="_blank">` with the right `href`. Screenshot both themes.

- [ ] **Step 6: Commit.**
```bash
git add libs/cms-ui/src/lib/about-page/about-page.component.ts
git commit -m "refactor(cms-ui): about social links to Material anchor buttons" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Series cards → CSS hover (remove inline JS)

**Files:**
- Modify: `libs/cms-ui/src/lib/series/series-list.component.ts`

**Cause:** the card uses inline `onmouseenter`/`onmouseleave` JS and inline `style=` for hover. Move to a real CSS hover in the component's `styles`. (Keeping it an anchor: `rhombus-card` is not confirmed to support a link mode, and a plain styled anchor is the correct primitive for a whole-card link.)

- [ ] **Step 1: Add component styles.** Replace the single-line `styles` (line 22) with:
```ts
  styles: [`
    :host { display: block; background: var(--bg); min-height: 100%; }

    .series-card {
      display: block;
      border: 1px solid var(--border);
      border-radius: var(--r-xl);
      padding: 16px;
      background: var(--surface-0);
      text-decoration: none;
      transition: box-shadow 0.15s, transform 0.15s, border-color 0.12s;
    }

    .series-card:hover {
      border-color: var(--border-accent);
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
  `],
```

- [ ] **Step 2: Replace the inline-JS/inline-style anchor.** Replace the `<a … onmouseenter … onmouseleave …>` block (lines 43–59) with a class-based anchor (drops inline JS + inline `style`):
```html
    <a
      [routerLink]="['/series', s.slug]"
      class="series-card"
    >
      <div class="flex items-start justify-between gap-2">
        <h3 class="text-base font-semibold" style="color: var(--text-primary)">{{ s.name }}</h3>
        <span class="text-xs shrink-0 mt-0.5" style="color: var(--text-muted)">
          {{ s.postCount }} {{ s.postCount === 1 ? 'post' : 'posts' }}
        </span>
      </div>
      @if (s.description) {
        <p class="text-sm mt-1" style="color: var(--text-secondary)">{{ s.description }}</p>
      }
    </a>
```
(Note: `rounded-xl`/`border`/`p-4` Tailwind utilities are replaced by the `.series-card` class so hover lives in CSS. Inner text colors stay inline for now — out of scope to tokenize further.)

- [ ] **Step 3: Type/lint gate.**
```bash
npx nx lint cms-ui
npx nx build cms-ui
```
Expected: both succeed.

- [ ] **Step 4: Visual gate.** Blog preview → `/series`. Confirm cards look identical to before, hover lifts/brightens via CSS (no inline JS), light + dark fine. `preview_console_logs` clean (no CSP/inline-handler warnings). Screenshot both themes.

- [ ] **Step 5: Commit.**
```bash
git add libs/cms-ui/src/lib/series/series-list.component.ts
git commit -m "refactor(cms-ui): series cards to CSS hover, remove inline JS" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Home hero CTAs → Material anchor buttons

**Files:**
- Modify: `libs/cms-ui/src/lib/home/blog-home.component.ts`

- [ ] **Step 1: Add `MatButtonModule` to imports.** Change line 19:
```ts
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
```
```ts
  imports: [RouterLink, MatButtonModule, FolioSkeletonComponent],
```

- [ ] **Step 2: Convert the CTA anchors.** Replace the `.hero-cta-row` inner anchors (lines 277–280) with anchor buttons:
```html
            <a matButton="filled" [routerLink]="ctaUrl()">{{ ctaLabel() }}</a>
            @if (secondaryCtaUrl()) {
              <a matButton="outlined" [routerLink]="secondaryCtaUrl()">{{ secondaryCtaLabel() }}</a>
            }
```

- [ ] **Step 3: Delete the bespoke button CSS.** Remove the `.btn-primary { … }` (lines 129–148) and `.btn-secondary { … }` (lines 150–169) style blocks. Keep `.hero-cta-row` (layout) and all skeleton/hero styles.

- [ ] **Step 4: Type/lint gate.**
```bash
npx nx lint cms-ui
npx nx build cms-ui
```
Expected: both succeed.

- [ ] **Step 5: Visual + semantics gate.** Blog preview → `/` (set `pages.home.enabled` is required; if Home isn't enabled in seed data, verify via the dashboard's Home route or temporarily). Confirm primary CTA is a teal filled button, secondary is outlined, both navigate (`preview_snapshot` shows `<a routerlink>`); light + dark fine; the `@media (max-width: 480px)` two-column grid still works (`preview_resize` to ~420px). Screenshot.

- [ ] **Step 6: Commit.**
```bash
git add libs/cms-ui/src/lib/home/blog-home.component.ts
git commit -m "refactor(cms-ui): home CTAs to Material anchor buttons" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Post-card tag pills cleanup + `--hero-*` token audit

**Files:**
- Modify: `libs/cms-ui/src/lib/post-list/blog-post-card.component.ts:362-368`
- Audit: `libs/cms-ui/src/styles/_tokens.scss`

**Scope:** post-card tag pills are *navigational anchors* (`routerLink` + `queryParams`) — keep as anchors. The only real cleanup is dead duplication; plus decide on the deprecated `--hero-*` tokens.

- [ ] **Step 1: Remove the duplicated inline style on card chips.** The `.chip` class already declares `position: relative; z-index: 20;`. Remove the redundant inline `style` attribute on the chip anchors (lines 362–368) so only the class drives it:
```html
                @for (tag of firstTwoTags(); track tag; let i = $index) {
                  <a
                    [routerLink]="['/posts']"
                    [queryParams]="{ tag: tag }"
                    [class]="i === 0 ? 'chip chip--primary' : 'chip'"
                  >{{ tag | tagLabel: tagLookupForLabels() }}</a>
                }
```

- [ ] **Step 2: Audit `--hero-*` tokens.** Find consumers:
```bash
npx nx@latest --version >/dev/null 2>&1; grep -rn "var(--hero-" libs apps --include=*.ts --include=*.scss --include=*.html
```
(or use the Grep tool for `var\(--hero-`). Expected: only the hero card in `blog-post-card.component.ts` consumes them.
  - **If only the hero card uses them:** leave the tokens in place but add a one-line comment in `_tokens.scss` above the `--hero-*` group: `/* Consumed only by the blog hero card (blog-post-card). */` so they're no longer ambiguously "deprecated brand". Do **not** delete (still in use).
  - **If unused anywhere:** delete the `--hero-*` declarations from `_tokens.scss`.

- [ ] **Step 3: Type/lint gate.**
```bash
npx nx lint cms-ui
npx nx build cms-ui
```
Expected: both succeed.

- [ ] **Step 4: Visual gate.** Blog preview → `/posts`. Confirm card tag pills + hero-card chips render unchanged in light + dark, links still navigate to filtered list. Screenshot.

- [ ] **Step 5: Commit.**
```bash
git add libs/cms-ui/src/lib/post-list/blog-post-card.component.ts libs/cms-ui/src/styles/_tokens.scss
git commit -m "refactor(cms-ui): tidy post-card tag pills, clarify hero tokens" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Diagnose & fix the empty footer region + final sweep

**Files:**
- Investigate: `libs/cms-ui/src/lib/app-shell/app-shell.component.html` / `.scss`, and rendered DOM
- Modify: whichever element is responsible (determined in Step 1)

**This is an investigation task** — the empty bordered box below "Powered by FolioKit" on the Series page (2nd screenshot) has no pre-known cause; diagnose first.

- [ ] **Step 1: Diagnose live.** Blog preview → `/series`. Use `preview_inspect` / `preview_snapshot` on the region directly below the `.folio-powered-footer`. Identify the offending element. Likely candidates:
  - (a) `.folio-powered-footer` has `border-top` and there is empty padded space *below* it (it's the last flex child with bottom padding/min-height), OR
  - (b) an empty rhombus-app-shell slot (e.g. `[shellNavFooter]`/aside) rendering a bordered, content-less container, OR
  - (c) a `min-height: 100%` content wrapper leaving a bordered gap at viewport bottom.

- [ ] **Step 2: Apply the targeted fix** based on Step 1:
  - **If (a):** in `app-shell.component.scss`, the `.folio-powered-footer` should hug content — ensure no stray `min-height`/bottom border creates the empty box; if the box is a separate empty `<footer>`/`<div>`, remove it from `app-shell.component.html`.
  - **If (b):** the `@if (navFooter)` guard (lines 48–52) should already prevent rendering an empty footer; if an empty container still renders, tighten the guard or remove the unused slot wrapper.
  - **If (c):** drop the redundant `min-height`/border on the content wrapper causing the gap.

  Write the concrete one- or two-line CSS/HTML removal here once identified; keep the change minimal and scoped to the empty element.

- [ ] **Step 3: Full gate.**
```bash
npx nx lint cms-ui
npx nx build cms-ui
npx nx test cms-ui
npx nx build blog
npx nx build admin
```
Expected: all succeed (admin/blog both consume the shared shell).

- [ ] **Step 4: Visual gate across pages.** Blog preview → `/`, `/posts`, `/series`, `/about`, `/links` in light + dark. Confirm: no empty bordered box on Series; all prior tasks still render correctly together; console clean on every route. Screenshot Series (the reported page) in both themes.

- [ ] **Step 5: Commit.**
```bash
git add libs/cms-ui/src/lib/app-shell/
git commit -m "fix(cms-ui): remove empty footer region on blog pages" -m "Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Follow-up (separate plan)

**Post detail page** (`blog-post-detail.component.ts`, `series-nav.component.ts`): convert the hand-rolled `.share-menu-panel` popover to `mat-menu`, align the `.series-eyebrow-link` pill to the tag-pill token look, keep the series TOC + prose. Deferred because the file needs a full read and the share-menu conversion depends on its live markup. Write its own `docs/superpowers/plans/` plan after Task 9, reusing the verification recipe above.

---

## Self-review (done by the planner)

- **Spec coverage:** §4.1→T1, §4.2→T2, §4.3→T3, §5.2(Home)→T7, §5.3(post card)→T8, §5.4(series)→T6, §5.5(About)→T5, §5.6(Links)→T4, §6(global/hero)→T8, §7(empty footer)→T9, §5.7(post detail)→Follow-up (explicitly deferred). §8 sequencing preserved. ✅
- **Placeholders:** none — every code step shows the exact edit; Task 9 is a labeled investigation with concrete diagnostics, not a TBD.
- **Type/name consistency:** `RhombusThemeMenuComponent`, `MatButtonModule`, `matButton="filled|outlined"`, `.link-row`/`.series-card` classes used consistently where introduced.
