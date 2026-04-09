# Shared Image Upload Pair Component + Icon Centering Fix

**Date:** 2026-04-09

## Context

The About and Links page editors each contain an identical "image upload pair" UI — a two-column grid with a light-mode and dark-mode image upload circle, hover overlays, progress bars, and error messages. The template code is ~60 lines duplicated verbatim in both components (modulo label text). Extracting it eliminates the duplication and makes future changes (accessibility, styling, new features) apply to both editors at once.

There is also a minor rendering issue: the mobile toggle preview button's `mat-icon` needs explicit sizing to fill the `mat-icon-button` correctly.

## Changes

### 1. Icon Centering Fix — `post-editor-page.component.ts`

Add `style="width:24px;height:24px"` to the `<mat-icon>` in the toggle preview button to ensure the SVG fills the button shell consistently:

```html
<mat-icon [svgIcon]="previewOpen() ? 'close' : 'preview'" style="width:24px;height:24px" />
```

### 2. New Component — `libs/cms-admin-ui/src/lib/page-editor/image-upload-pair.component.ts`

Selector: `admin-image-upload-pair`

Purely presentational. Owns:
- Section label + optional subtitle
- 2-column light/dark grid
- Circular upload target (dashed border when empty, image + hover overlay when populated)
- Hover overlay with Replace (`swap_horiz`) and Remove (`delete`) icon buttons
- Hidden `<input type="file">` elements (one per slot)
- Progress bar (shown during active upload)
- Error message

Does NOT own:
- Firebase upload logic
- Storage path resolution
- State signals (all passed in as inputs)

**Inputs** (Angular signals API — `input()` / `input.required()`):

| Name | Type | Default |
|---|---|---|
| `label` | `string` | *(required)* |
| `subtitle` | `string` | `'Dark variant is optional — shown when dark mode is active.'` |
| `lightUrl` | `string \| undefined` | `undefined` |
| `darkUrl` | `string \| undefined` | `undefined` |
| `lightUploading` | `boolean` | `false` |
| `darkUploading` | `boolean` | `false` |
| `lightProgress` | `number` | `0` |
| `darkProgress` | `number` | `0` |
| `lightError` | `string \| null` | `null` |
| `darkError` | `string \| null` | `null` |

**Outputs** (Angular signals API — `output()`):

| Name | Payload |
|---|---|
| `lightFileSelected` | `File` |
| `darkFileSelected` | `File` |
| `lightRemoved` | `void` |
| `darkRemoved` | `void` |

**Behaviour notes:**
- Replace button triggers the hidden file input directly (browser `click()`)
- Remove button emits `lightRemoved` / `darkRemoved` — parent clears the URL and calls Firebase as needed
- `isPlatformBrowser` guard on click (same as existing code)
- Progress bar shown when `lightUploading()` or `darkUploading()` is true, value from the corresponding `*Progress` input
- Error messages shown below the grid if `lightError()` or `darkError()` is non-null

### 3. Update About — `about-page-editor.component.ts`

Replace the "Profile Photo" template block (~60 lines) with:

```html
<admin-image-upload-pair
  label="Profile Photo"
  subtitle="Dark photo is optional — shown when dark mode is active."
  [lightUrl]="aboutPhotoUrl()"
  [darkUrl]="aboutPhotoDarkUrl()"
  [lightUploading]="aboutPhotoUploading()"
  [darkUploading]="aboutPhotoDarkUploading()"
  [lightProgress]="aboutPhotoProgress()"
  [darkProgress]="aboutPhotoDarkProgress()"
  [lightError]="aboutPhotoError()"
  [darkError]="aboutPhotoDarkError()"
  (lightFileSelected)="onPhotoSelected($event)"
  (darkFileSelected)="onPhotoDarkSelected($event)"
  (lightRemoved)="removeAboutPhoto()"
  (darkRemoved)="removeAboutPhotoDark()"
/>
```

Remove `@ViewChild('photoInput')` and `@ViewChild('photoDarkInput')` — those refs move into the new component. Update `onPhotoSelected` and `onPhotoDarkSelected` to accept a `File` directly instead of `FileList | null`.

### 4. Update Links — `links-editor-form.component.ts`

Replace the "Avatar" template block (~60 lines) with:

```html
<admin-image-upload-pair
  label="Avatar"
  subtitle="Dark avatar is optional — shown when dark mode is active."
  [lightUrl]="cfg.avatarUrl"
  [darkUrl]="cfg.avatarUrlDark"
  [lightUploading]="avatarUploading()"
  [darkUploading]="avatarDarkUploading()"
  [lightProgress]="avatarProgress()"
  [darkProgress]="avatarDarkProgress()"
  [lightError]="avatarError()"
  [darkError]="avatarDarkError()"
  (lightFileSelected)="onAvatarSelected($event)"
  (darkFileSelected)="onAvatarDarkSelected($event)"
  (lightRemoved)="onDeleteAvatar(cfg)"
  (darkRemoved)="onDeleteAvatarDark(cfg)"
/>
```

Remove `@ViewChild('avatarInput')` and `@ViewChild('avatarDarkInput')`. Update `onAvatarSelected` and `onAvatarDarkSelected` to accept `File` directly.

## Files Changed

| File | Change |
|---|---|
| `libs/cms-admin-ui/src/lib/post-editor/post-editor-page.component.ts` | Add `style` to toggle `mat-icon` |
| `libs/cms-admin-ui/src/lib/page-editor/image-upload-pair.component.ts` | **New file** |
| `libs/cms-admin-ui/src/lib/page-editor/about-page-editor.component.ts` | Use new component, remove ViewChild refs, update method signatures |
| `libs/cms-admin-ui/src/lib/page-editor/links-editor-form.component.ts` | Use new component, remove ViewChild refs, update method signatures |

## Verification

1. About page editor: Profile photo upload (light + dark) — upload, replace, remove, progress bar, error message all work.
2. Links page editor: Avatar upload — same checks.
3. Post editor on narrow viewport: toggle preview button icon is centered; shows `preview` when closed and `close` when open.
4. Build: `nx build cms-admin-ui` passes clean.
