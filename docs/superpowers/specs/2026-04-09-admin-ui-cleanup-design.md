# Admin UI Cleanup: Toggle Icon + Links/About Parity

**Date:** 2026-04-09

## Context

Three related polish tasks for the Admin area:

1. The mobile "Toggle preview" button in the post editor uses a static custom SVG (`svgIcon="preview"`) that never changes — the user gets no visual feedback about whether the preview is open or closed.
2. The Links page editor renders full-width at all viewport sizes, while the About page editor constrains content to `max-w-2xl` with centered layout. These two sibling editors look structurally different on wide screens.
3. About uses `appearance="outline"` on all form fields; Links uses default appearance. The shared avatar upload UI, section headers, and sticky footer/toolbar structure are already aligned — but form field visual style is not.

## Changes

### 1. Toggle Preview Button — `libs/cms-admin-ui/src/lib/post-editor/post-editor-page.component.ts`

**Location:** Lines 218–221 (the `@if (!isDesktop())` block)

**Change:** Replace the static `svgIcon="preview"` attribute with a stateful native Material icon ligature that reflects `previewOpen()` signal state.

```html
<!-- Before -->
<button mat-icon-button (click)="togglePreview()" matTooltip="Toggle preview">
  <mat-icon svgIcon="preview" />
</button>

<!-- After -->
<button mat-icon-button (click)="togglePreview()" matTooltip="Toggle preview">
  <mat-icon>{{ previewOpen() ? 'close' : 'preview' }}</mat-icon>
</button>
```

- No `svgIcon` attribute — uses Material Icons font ligature
- `preview` icon when preview is closed (click to open)
- `close` icon when preview is open (click to close)

### 2. Links Layout + Field Appearance — `libs/cms-admin-ui/src/lib/page-editor/links-editor-form.component.ts`

**Change A — Outer wrapper (line 88):** Replace `p-4` with About's centering pattern:

```html
<!-- Before -->
<div class="flex flex-col gap-6 p-4">

<!-- After -->
<div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
```

**Change B — Form field appearance:** Add `appearance="outline"` to all `mat-form-field` elements in the template. Affected fields:
- Title (line 90)
- Headline (line 183)
- Bio (line 193)
- Label inside link item (line 242)
- URL inside link item (line 251)
- Platform inside link item (line 264)

### 3. About — No Changes

About is the reference layout. No modifications needed.

## Files Changed

| File | Change |
|------|--------|
| `libs/cms-admin-ui/src/lib/post-editor/post-editor-page.component.ts` | Toggle icon stateful, switch to ligature |
| `libs/cms-admin-ui/src/lib/page-editor/links-editor-form.component.ts` | Max-width centering + outline appearance |

## Verification

1. **Toggle button:** Open post editor on a narrow viewport (< 1024px). Toggle preview open and closed — icon should switch between `preview` and `close`.
2. **Links max-width:** Open Admin → Links on a wide screen. Content should be centered with visible side gaps, matching the About page editor layout.
3. **Links outline fields:** All form fields in Links editor should render with the Material outline style, matching About editor.
4. No regressions on the About page editor (untouched).
