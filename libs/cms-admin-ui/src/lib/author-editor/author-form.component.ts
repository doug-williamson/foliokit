import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { FIREBASE_STORAGE, SocialPlatform } from '@foliokit/cms-core';
import { AuthorEditorStore } from './author-editor.store';

const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'bluesky', label: 'Bluesky' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'github', label: 'GitHub' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'email', label: 'Email' },
  { value: 'website', label: 'Website' },
];

/**
 * Author create/edit form with light/dark profile photo upload,
 * bio, email, and social links fields.
 *
 * `AuthorEditorStore` must be provided at the route level (already
 * wired in `adminRoutes`). Navigates back to `/authors` on save.
 */
@Component({
  selector: 'folio-author-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 px-6 py-3 border-b shrink-0"
           style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
        <button mat-icon-button matTooltip="Back to authors" (click)="router.navigate(['/authors'])">
          <mat-icon svgIcon="arrow_back" />
        </button>
        <h1 class="flex-1 text-lg font-semibold">
          {{ store.isNew() ? 'New Author' : 'Edit Author' }}
        </h1>

        @if (store.isSaving()) {
          <span class="text-xs opacity-40">Saving…</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        } @else if (!store.isDirty() && !store.isNew()) {
          <span class="text-xs opacity-40">Saved</span>
        }

        <button
          mat-flat-button
          [disabled]="form.invalid || store.isSaving()"
          (click)="onSave()"
        >
          Save
        </button>
      </div>

      <!-- Scrollable form -->
      <div class="flex-1 overflow-y-auto">
        <form [formGroup]="form" class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
          <!-- Photo upload (light + dark) -->
          <div class="flex flex-col gap-2">
            <span class="text-sm font-semibold">Profile Photo</span>
            <div class="grid grid-cols-2 gap-6 justify-items-center items-start">
              <!-- Light mode -->
              <div class="flex flex-col items-center gap-1">
                @if (store.author()?.photoUrl; as url) {
                  <div class="relative w-24 h-24 shrink-0 rounded-full overflow-hidden group">
                    <img [src]="url" alt="Author photo (light)" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                         style="background: rgba(0,0,0,0.5)">
                      <button mat-icon-button style="color:white" title="Replace" (click)="isBrowser && photoInput.click()">
                        <mat-icon svgIcon="swap_horiz" />
                      </button>
                      <button mat-icon-button style="color:white" title="Remove" (click)="removePhoto('light')">
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
                    (click)="isBrowser && photoInput.click()"
                    (keydown.enter)="isBrowser && photoInput.click()"
                  >
                    <mat-icon class="opacity-40" svgIcon="upload" />
                    <span class="text-xs opacity-40">Upload</span>
                  </div>
                }
                <span class="text-xs opacity-50 leading-none">Light</span>
              </div>
              <!-- Dark mode -->
              <div class="flex flex-col items-center gap-1">
                @if (store.author()?.photoUrlDark; as url) {
                  <div class="relative w-24 h-24 shrink-0 rounded-full overflow-hidden group" style="background: #1a1a1a">
                    <img [src]="url" alt="Author photo (dark)" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                         style="background: rgba(0,0,0,0.5)">
                      <button mat-icon-button style="color:white" title="Replace" (click)="isBrowser && photoDarkInput.click()">
                        <mat-icon svgIcon="swap_horiz" />
                      </button>
                      <button mat-icon-button style="color:white" title="Remove" (click)="removePhoto('dark')">
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
                    (click)="isBrowser && photoDarkInput.click()"
                    (keydown.enter)="isBrowser && photoDarkInput.click()"
                  >
                    <mat-icon class="opacity-40" svgIcon="upload" />
                    <span class="text-xs opacity-40">Upload</span>
                  </div>
                }
                <span class="text-xs opacity-50 leading-none">Dark</span>
              </div>
            </div>
            <input #photoInput type="file" accept="image/*" class="hidden"
                   (change)="onPhotoSelected($any($event.target).files, 'light')" />
            <input #photoDarkInput type="file" accept="image/*" class="hidden"
                   (change)="onPhotoSelected($any($event.target).files, 'dark')" />
            @if (uploading()) {
              <mat-progress-bar mode="determinate" [value]="uploadProgress()" class="max-w-[13rem]" />
            }
            @if (uploadError()) {
              <p class="text-xs text-red-500">{{ uploadError() }}</p>
            }
          </div>

          <!-- Display name -->
          <mat-form-field appearance="outline">
            <mat-label>Display Name</mat-label>
            <input matInput formControlName="displayName" placeholder="Jane Doe" />
            @if (form.get('displayName')?.hasError('required') && form.get('displayName')?.touched) {
              <mat-error>Display name is required</mat-error>
            }
          </mat-form-field>

          <!-- Email -->
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" placeholder="jane@example.com" />
          </mat-form-field>

          <!-- Bio -->
          <mat-form-field appearance="outline">
            <mat-label>Bio</mat-label>
            <textarea
              matInput
              formControlName="bio"
              rows="4"
              placeholder="A short biography…"
            ></textarea>
          </mat-form-field>

          <!-- Social links -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold">Social Links</span>
              <button mat-stroked-button type="button" (click)="addSocialLink()">
                <mat-icon svgIcon="add" />
                Add Link
              </button>
            </div>

            <div formArrayName="socialLinks" class="flex flex-col gap-3">
              @for (ctrl of socialLinksArray.controls; track $index) {
                <div [formGroupName]="$index"
                     class="flex flex-col gap-2 p-3 rounded-lg border"
                     style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
                  <div class="flex items-start gap-2">
                    <mat-form-field appearance="outline" class="flex-1">
                      <mat-label>Platform</mat-label>
                      <mat-select formControlName="platform">
                        @for (p of platforms; track p.value) {
                          <mat-option [value]="p.value">{{ p.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <button
                      mat-icon-button
                      type="button"
                      class="shrink-0 mt-1"
                      matTooltip="Remove"
                      (click)="removeSocialLink($index)"
                    >
                      <mat-icon svgIcon="delete" />
                    </button>
                  </div>
                  <div class="flex gap-2">
                    <mat-form-field appearance="outline" class="flex-1">
                      <mat-label>Label</mat-label>
                      <input matInput formControlName="label" placeholder="Optional label" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="flex-1">
                      <mat-label>URL</mat-label>
                      <input matInput formControlName="url" placeholder="https://…" />
                    </mat-form-field>
                  </div>
                </div>
              }
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class AuthorFormComponent implements OnInit, OnDestroy {
  readonly store = inject(AuthorEditorStore);
  protected readonly router = inject(Router);
  private readonly storage = inject(FIREBASE_STORAGE);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);

  /** Route parameter: existing author ID, or absent to create a new author. */
  readonly id = input<string | undefined>(undefined);

  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  protected readonly uploading = signal(false);
  protected readonly uploadProgress = signal(0);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly storagePath = signal<string | null>(null);
  private activeUploadTask: ReturnType<typeof uploadBytesResumable> | null = null;

  protected readonly platforms = SOCIAL_PLATFORMS;

  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('photoDarkInput') photoDarkInput!: ElementRef<HTMLInputElement>;

  protected readonly form: FormGroup = this.fb.group({
    displayName: ['', Validators.required],
    email: [''],
    bio: [''],
    socialLinks: this.fb.array([]),
  });

  get socialLinksArray(): FormArray {
    return this.form.get('socialLinks') as FormArray;
  }

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.store.loadAuthor(id);
    } else {
      this.store.initNew();
    }

    // Sync store → form once author loads
    const syncInterval = setInterval(() => {
      const author = this.store.author();
      if (author) {
        clearInterval(syncInterval);
        this.form.patchValue({
          displayName: author.displayName ?? '',
          email: author.email ?? '',
          bio: author.bio ?? '',
        });

        // Populate social links
        this.socialLinksArray.clear();
        for (const link of author.socialLinks ?? []) {
          this.socialLinksArray.push(
            this.fb.group({
              platform: [link.platform],
              label: [link.label ?? ''],
              url: [link.url ?? ''],
            }),
          );
        }

        // Watch form changes → update store
        this.form.valueChanges.subscribe((val) => {
          this.store.updateField('displayName', val.displayName ?? '');
          this.store.updateField('email', val.email ?? undefined);
          this.store.updateField('bio', val.bio ?? undefined);
          this.store.updateField('socialLinks', (val.socialLinks ?? []).map(
            (s: { platform: string; label: string; url: string }) => ({
              platform: s.platform as SocialPlatform,
              label: s.label || undefined,
              url: s.url,
            }),
          ));
        });
      }
    }, 50);
  }

  ngOnDestroy(): void {
    this.activeUploadTask?.cancel();
  }

  protected addSocialLink(): void {
    this.socialLinksArray.push(
      this.fb.group({ platform: ['website'], label: [''], url: [''] }),
    );
  }

  protected removeSocialLink(index: number): void {
    this.socialLinksArray.removeAt(index);
  }

  protected onPhotoSelected(files: FileList | null, target: 'light' | 'dark' = 'light'): void {
    if (!files?.length) return;
    this.uploadPhoto(files[0], target);
    const inputRef = target === 'light' ? this.photoInput : this.photoDarkInput;
    if (inputRef?.nativeElement) {
      inputRef.nativeElement.value = '';
    }
  }

  protected removePhoto(target: 'light' | 'dark'): void {
    if (target === 'light') {
      this.store.updateField('photoUrl', undefined);
    } else {
      this.store.updateField('photoUrlDark', undefined);
    }
    this.storagePath.set(null);
  }

  protected onSave(): void {
    if (this.form.invalid) return;
    this.store.save(() => this.router.navigate(['/authors']));
  }

  private uploadPhoto(file: File, target: 'light' | 'dark' = 'light'): void {
    if (!this.storage) return;
    this.activeUploadTask?.cancel();
    this.activeUploadTask = null;

    const authorId = this.store.author()?.id || crypto.randomUUID();
    const folder = target === 'dark' ? 'photo-dark' : 'photo';
    const path = `authors/${authorId}/${folder}/${file.name}`;

    this.uploading.set(true);
    this.uploadProgress.set(0);
    this.uploadError.set(null);

    const fileRef = ref(this.storage, path);
    const task = uploadBytesResumable(fileRef, file);
    this.activeUploadTask = task;

    task.on(
      'state_changed',
      (snapshot) => {
        this.uploadProgress.set(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        );
      },
      (error) => {
        task.cancel();
        this.activeUploadTask = null;
        this.uploading.set(false);
        this.uploadError.set(error.message);
      },
      () => {
        this.activeUploadTask = null;
        getDownloadURL(task.snapshot.ref).then((downloadUrl) => {
          const field = target === 'dark' ? 'photoUrlDark' : 'photoUrl';
          this.store.updateField(field, downloadUrl);
          this.storagePath.set(path);
          this.uploading.set(false);
        });
      },
    );
  }
}
