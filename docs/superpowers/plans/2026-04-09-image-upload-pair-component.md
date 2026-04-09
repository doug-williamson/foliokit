# Image Upload Pair Component + Icon Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract duplicate image upload UI from About and Links editors into a shared `AdminImageUploadPairComponent`, and fix the toggle preview icon centering.

**Architecture:** Create a purely presentational `ImageUploadPairComponent` that owns the upload circle UI, file input triggering, progress/error display, and emits typed events to the parent. Parents retain all Firebase/storage logic. The icon fix is a one-line style addition.

**Tech Stack:** Angular 17+ (standalone components, signals API `input()`/`output()`), Angular Material, Tailwind CSS, TypeScript.

---

## File Map

| Action | File |
|---|---|
| **Modify** | `libs/cms-admin-ui/src/lib/post-editor/post-editor-page.component.ts` |
| **Create** | `libs/cms-admin-ui/src/lib/page-editor/image-upload-pair.component.ts` |
| **Modify** | `libs/cms-admin-ui/src/lib/page-editor/about-page-editor.component.ts` |
| **Modify** | `libs/cms-admin-ui/src/lib/page-editor/links-editor-form.component.ts` |

---

## Task 1: Fix toggle preview icon centering

**Files:**
- Modify: `libs/cms-admin-ui/src/lib/post-editor/post-editor-page.component.ts`

- [ ] **Step 1: Add explicit size to mat-icon in the toggle button**

In the `@if (!isDesktop())` block (around line 219), add `style="width:24px;height:24px"` to the `mat-icon`:

```html
@if (!isDesktop()) {
  <button mat-icon-button (click)="togglePreview()" matTooltip="Toggle preview">
    <mat-icon [svgIcon]="previewOpen() ? 'close' : 'preview'" style="width:24px;height:24px" />
  </button>
```

- [ ] **Step 2: Build to verify**

```bash
cd C:/GitHub/foliokit && npx nx build cms-admin-ui --skip-nx-cache
```

Expected: `Successfully ran target build for project cms-admin-ui`

- [ ] **Step 3: Commit**

```bash
git add libs/cms-admin-ui/src/lib/post-editor/post-editor-page.component.ts
git commit -m "fix(post-editor): center toggle preview icon with explicit 24px size"
```

---

## Task 2: Create `ImageUploadPairComponent`

**Files:**
- Create: `libs/cms-admin-ui/src/lib/page-editor/image-upload-pair.component.ts`

- [ ] **Step 1: Create the component file**

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  inject,
  input,
  output,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'admin-image-upload-pair',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="flex flex-col gap-2">
      <span class="text-sm font-semibold">{{ label() }}</span>
      <p class="text-xs opacity-50 -mt-1">{{ subtitle() }}</p>
      <div class="grid grid-cols-2 gap-6 justify-items-center items-start">
        <!-- Light mode -->
        <div class="flex flex-col items-center gap-1">
          @if (lightUrl(); as url) {
            <div class="relative w-24 h-24 shrink-0 rounded-full overflow-hidden group">
              <img [src]="url" alt="Image (light)" class="w-full h-full object-cover" />
              <div class="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                   style="background: rgba(0,0,0,0.5)">
                <button mat-icon-button style="color:white" title="Replace" type="button"
                        (click)="isBrowser && lightInput.click()">
                  <mat-icon svgIcon="swap_horiz" />
                </button>
                <button mat-icon-button style="color:white" title="Remove" type="button"
                        (click)="lightRemoved.emit()">
                  <mat-icon svgIcon="delete" />
                </button>
              </div>
            </div>
          } @else {
            <div
              class="w-24 h-24 shrink-0 rounded-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed gap-1"
              style="border-color: color-mix(in srgb, currentColor 25%, transparent)"
              role="button"
              tabindex="0"
              (click)="isBrowser && lightInput.click()"
              (keydown.enter)="isBrowser && lightInput.click()"
            >
              <mat-icon class="opacity-40" svgIcon="upload" />
              <span class="text-xs opacity-40">Upload</span>
            </div>
          }
          <span class="text-xs opacity-50 leading-none">Light</span>
        </div>
        <!-- Dark mode -->
        <div class="flex flex-col items-center gap-1">
          @if (darkUrl(); as url) {
            <div class="relative w-24 h-24 shrink-0 rounded-full overflow-hidden group"
                 style="background: #1a1a1a">
              <img [src]="url" alt="Image (dark)" class="w-full h-full object-cover" />
              <div class="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                   style="background: rgba(0,0,0,0.5)">
                <button mat-icon-button style="color:white" title="Replace" type="button"
                        (click)="isBrowser && darkInput.click()">
                  <mat-icon svgIcon="swap_horiz" />
                </button>
                <button mat-icon-button style="color:white" title="Remove" type="button"
                        (click)="darkRemoved.emit()">
                  <mat-icon svgIcon="delete" />
                </button>
              </div>
            </div>
          } @else {
            <div
              class="w-24 h-24 shrink-0 rounded-full flex flex-col items-center justify-center cursor-pointer border-2 border-dashed gap-1"
              style="border-color: color-mix(in srgb, currentColor 25%, transparent)"
              role="button"
              tabindex="0"
              (click)="isBrowser && darkInput.click()"
              (keydown.enter)="isBrowser && darkInput.click()"
            >
              <mat-icon class="opacity-40" svgIcon="upload" />
              <span class="text-xs opacity-40">Upload</span>
            </div>
          }
          <span class="text-xs opacity-50 leading-none">Dark</span>
        </div>
      </div>
      <input #lightInput type="file" accept="image/*" class="hidden"
             (change)="onLightFileChange($event)" />
      <input #darkInput type="file" accept="image/*" class="hidden"
             (change)="onDarkFileChange($event)" />
      @if (lightUploading() || darkUploading()) {
        <mat-progress-bar
          mode="determinate"
          [value]="lightUploading() ? lightProgress() : darkProgress()"
          class="max-w-[13rem]"
        />
      }
      @if (lightError()) {
        <p class="text-xs text-red-500">{{ lightError() }}</p>
      }
      @if (darkError()) {
        <p class="text-xs text-red-500">{{ darkError() }}</p>
      }
    </div>
  `,
})
export class ImageUploadPairComponent {
  @ViewChild('lightInput') private lightInput!: ElementRef<HTMLInputElement>;
  @ViewChild('darkInput') private darkInput!: ElementRef<HTMLInputElement>;

  private readonly platformId = inject(PLATFORM_ID);
  protected readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly label = input.required<string>();
  readonly subtitle = input('Dark variant is optional — shown when dark mode is active.');
  readonly lightUrl = input<string | undefined>(undefined);
  readonly darkUrl = input<string | undefined>(undefined);
  readonly lightUploading = input(false);
  readonly darkUploading = input(false);
  readonly lightProgress = input(0);
  readonly darkProgress = input(0);
  readonly lightError = input<string | null>(null);
  readonly darkError = input<string | null>(null);

  readonly lightFileSelected = output<File>();
  readonly darkFileSelected = output<File>();
  readonly lightRemoved = output<void>();
  readonly darkRemoved = output<void>();

  protected onLightFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.lightFileSelected.emit(input.files[0]);
      input.value = '';
    }
  }

  protected onDarkFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.darkFileSelected.emit(input.files[0]);
      input.value = '';
    }
  }
}
```

- [ ] **Step 2: Build to verify**

```bash
cd C:/GitHub/foliokit && npx nx build cms-admin-ui --skip-nx-cache
```

Expected: `Successfully ran target build for project cms-admin-ui`

- [ ] **Step 3: Commit**

```bash
git add libs/cms-admin-ui/src/lib/page-editor/image-upload-pair.component.ts
git commit -m "feat(cms-admin-ui): add ImageUploadPairComponent for reusable light/dark image upload"
```

---

## Task 3: Wire `ImageUploadPairComponent` into About

**Files:**
- Modify: `libs/cms-admin-ui/src/lib/page-editor/about-page-editor.component.ts`

- [ ] **Step 1: Add import and replace template block**

In `about-page-editor.component.ts`:

**a) Add to the `imports` array:**
```typescript
import { ImageUploadPairComponent } from './image-upload-pair.component';
```
Add `ImageUploadPairComponent` to the component's `imports: [...]` array.

**b) Replace the entire `<!-- Photo upload (light + dark) -->` div block** (from `<div class="flex flex-col gap-2">` with label "Profile Photo" through the closing `</div>` before `<mat-form-field appearance="outline">` for Photo Alt Text — approximately lines 127–205) with:

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

**c) Remove the two `@ViewChild` declarations** (both `photoInput` and `photoDarkInput`):
```typescript
// Remove these two lines:
@ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;
@ViewChild('photoDarkInput') photoDarkInput!: ElementRef<HTMLInputElement>;
```

**d) Remove unused imports and fields** — the photo upload block was the only consumer of these:

From the Angular core import, remove `ElementRef`, `ViewChild`, and `PLATFORM_ID`:
```typescript
// Remove from @angular/core import list: ElementRef, ViewChild, PLATFORM_ID
```

Remove the `@angular/common` import entirely (only used for `isPlatformBrowser`):
```typescript
// Remove this line:
import { isPlatformBrowser } from '@angular/common';
```

Remove the two class fields:
```typescript
// Remove these two lines from the class body:
private readonly platformId = inject(PLATFORM_ID);
protected readonly isBrowser = isPlatformBrowser(this.platformId);
```

**e) Update method signatures** to accept `File` directly instead of `FileList | null`:

```typescript
protected onPhotoSelected(file: File): void {
  this.uploadAboutPhoto(file);
}

protected onPhotoDarkSelected(file: File): void {
  this.uploadAboutPhotoDark(file);
}
```

- [ ] **Step 2: Build to verify**

```bash
cd C:/GitHub/foliokit && npx nx build cms-admin-ui --skip-nx-cache
```

Expected: `Successfully ran target build for project cms-admin-ui`

- [ ] **Step 3: Commit**

```bash
git add libs/cms-admin-ui/src/lib/page-editor/about-page-editor.component.ts
git commit -m "refactor(about-editor): use ImageUploadPairComponent for profile photo upload"
```

---

## Task 4: Wire `ImageUploadPairComponent` into Links

**Files:**
- Modify: `libs/cms-admin-ui/src/lib/page-editor/links-editor-form.component.ts`

- [ ] **Step 1: Add import and replace template block**

In `links-editor-form.component.ts`:

**a) Add to the `imports` array:**
```typescript
import { ImageUploadPairComponent } from './image-upload-pair.component';
```
Add `ImageUploadPairComponent` to the component's `imports: [...]` array.

**b) Replace the entire `<!-- Avatar upload (light + dark) -->` div block** (from `<div class="flex flex-col gap-2">` with label "Avatar" through its closing `</div>`, before `<!-- Headline -->`) with:

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

**c) Remove the two `@ViewChild` declarations:**
```typescript
// Remove these two lines:
@ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;
@ViewChild('avatarDarkInput') avatarDarkInput!: ElementRef<HTMLInputElement>;
```

**d) Remove `ElementRef` from the Angular core import:**
```typescript
// Before:
import { ..., ElementRef, ... } from '@angular/core';
// After: remove ElementRef from the list
```

**e) Update method signatures** to accept `File` directly (remove the manual input reset — it now happens inside the component):

```typescript
onAvatarSelected(file: File): void {
  this.uploadAvatar(file);
}

onAvatarDarkSelected(file: File): void {
  this.uploadAvatarDark(file);
}
```

**f) Remove `isPlatformBrowser` import and `isBrowser` field** — they are no longer used in this component:

```typescript
// Remove from imports:
import { isPlatformBrowser } from '@angular/common';

// Remove field:
readonly isBrowser = isPlatformBrowser(this.platformId);
```

Also remove `PLATFORM_ID` from the Angular core import and `private readonly platformId = inject(PLATFORM_ID);` since neither is needed anymore.

- [ ] **Step 2: Build to verify**

```bash
cd C:/GitHub/foliokit && npx nx build cms-admin-ui --skip-nx-cache
```

Expected: `Successfully ran target build for project cms-admin-ui`

- [ ] **Step 3: Commit**

```bash
git add libs/cms-admin-ui/src/lib/page-editor/links-editor-form.component.ts
git commit -m "refactor(links-editor): use ImageUploadPairComponent for avatar upload"
```
