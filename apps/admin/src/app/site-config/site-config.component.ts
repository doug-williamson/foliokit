import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AboutPageConfig,
  AuthorService,
  FIREBASE_STORAGE,
  NavItem,
  SocialLink,
  SocialPlatform,
} from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '@foliokit/cms-admin-ui';

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

@Component({
  selector: 'admin-site-config',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DragDropModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
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
      ::ng-deep .mat-mdc-tab-body-wrapper {
        flex: 1;
        overflow: hidden;
      }
      ::ng-deep .mat-mdc-tab-body-content {
        height: 100%;
        overflow-y: auto;
      }
      .drag-handle {
        cursor: grab;
        touch-action: none;
      }
      .drag-handle:active {
        cursor: grabbing;
      }
      .cdk-drag-preview {
        box-sizing: border-box;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      }
      .cdk-drag-placeholder {
        opacity: 0.3;
      }
      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden relative">
      <!-- Header -->
      <div class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
           style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
        <h1 class="flex-1 text-xl font-semibold">Site Configuration</h1>
        @if (store.isSaving()) {
          <span class="text-xs opacity-40">Saving…</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        }
      </div>

      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <!-- Tabs -->
        <mat-tab-group
          class="flex flex-col flex-1 overflow-hidden"
          animationDuration="0"
          (selectedTabChange)="onTabChange()"
        >
          <!-- ── General ── -->
          <mat-tab label="General">
            <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
              <form [formGroup]="generalForm" class="flex flex-col gap-5">
                <mat-form-field appearance="outline">
                  <mat-label>Site Name</mat-label>
                  <input matInput formControlName="siteName" placeholder="My Blog" />
                  @if (generalForm.get('siteName')?.hasError('required') && generalForm.get('siteName')?.touched) {
                    <mat-error>Site name is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Site URL</mat-label>
                  <input matInput formControlName="siteUrl" placeholder="https://example.com" />
                  @if (generalForm.get('siteUrl')?.hasError('required') && generalForm.get('siteUrl')?.touched) {
                    <mat-error>Site URL is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Default Author</mat-label>
                  <mat-select formControlName="defaultAuthorId">
                    <mat-option [value]="null">— None —</mat-option>
                    @for (author of authors(); track author.id) {
                      <mat-option [value]="author.id">{{ author.displayName }}</mat-option>
                    }
                  </mat-select>
                  @if (!authors().length) {
                    <mat-hint>
                      No authors yet.
                      <a routerLink="/authors/new" class="underline">Create one</a>
                    </mat-hint>
                  }
                </mat-form-field>
              </form>
            </div>
          </mat-tab>

          <!-- ── Navigation ── -->
          <mat-tab label="Navigation">
            <div class="flex flex-col gap-4 max-w-3xl mx-auto px-6 py-8">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold">Nav Items</span>
                <button mat-stroked-button type="button" (click)="addNavItem()">
                  <mat-icon>add</mat-icon>
                  Add Nav Item
                </button>
              </div>

              <div
                cdkDropList
                (cdkDropListDropped)="onNavDrop($event)"
                class="flex flex-col gap-2"
              >
                @for (ctrl of navItemsArray.controls; track $index) {
                  <div
                    cdkDrag
                    [formGroup]="asFormGroup(ctrl)"
                    class="flex items-start gap-2 p-3 rounded-lg border"
                    style="border-color: color-mix(in srgb, currentColor 12%, transparent); background: var(--mat-sys-surface)"
                  >
                    <mat-icon cdkDragHandle class="drag-handle opacity-40 mt-3 shrink-0">drag_indicator</mat-icon>

                    <mat-form-field appearance="outline" class="flex-1 min-w-0">
                      <mat-label>Label</mat-label>
                      <input matInput formControlName="label" placeholder="Home" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="flex-1 min-w-0">
                      <mat-label>URL / Route</mat-label>
                      <input matInput formControlName="url" placeholder="/home" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-32 shrink-0">
                      <mat-label>Icon</mat-label>
                      <input matInput formControlName="icon" placeholder="home" />
                    </mat-form-field>

                    <div class="flex flex-col items-center shrink-0 pt-1">
                      <span class="text-xs opacity-50 mb-1">External</span>
                      <mat-slide-toggle formControlName="external" />
                    </div>

                    <button
                      mat-icon-button
                      type="button"
                      class="shrink-0 mt-1"
                      matTooltip="Remove"
                      (click)="removeNavItem($index)"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                }

                @if (!navItemsArray.length) {
                  <p class="text-sm opacity-50 text-center py-8">
                    No nav items yet. Add one to get started.
                  </p>
                }
              </div>
            </div>
          </mat-tab>

          <!-- ── SEO ── -->
          <mat-tab label="SEO">
            <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
              <form [formGroup]="seoForm" class="flex flex-col gap-5">
                <mat-form-field appearance="outline">
                  <mat-label>Meta Title</mat-label>
                  <input matInput formControlName="title" placeholder="My Awesome Blog" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Meta Description</mat-label>
                  <textarea matInput formControlName="description" rows="3"
                            placeholder="A brief description of your site…"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>OG Image URL</mat-label>
                  <input matInput formControlName="ogImage" placeholder="https://…/og.jpg" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Canonical URL</mat-label>
                  <input matInput formControlName="canonicalUrl" placeholder="https://example.com" />
                </mat-form-field>
              </form>
            </div>
          </mat-tab>

          <!-- ── Theme ── -->
          <mat-tab label="Theme">
            <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
              <form [formGroup]="themeForm" class="flex flex-col gap-5">
                <div class="flex items-center gap-4">
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Primary Color</mat-label>
                    <input matInput formControlName="primaryColor" placeholder="#6200ea" />
                  </mat-form-field>
                  <span
                    class="w-8 h-8 rounded border shrink-0"
                    style="border-color: color-mix(in srgb, currentColor 20%, transparent)"
                    [style.background]="themeForm.get('primaryColor')?.value || 'transparent'"
                  ></span>
                </div>

                <div class="flex items-center gap-4">
                  <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>Accent Color</mat-label>
                    <input matInput formControlName="accentColor" placeholder="#03dac6" />
                  </mat-form-field>
                  <span
                    class="w-8 h-8 rounded border shrink-0"
                    style="border-color: color-mix(in srgb, currentColor 20%, transparent)"
                    [style.background]="themeForm.get('accentColor')?.value || 'transparent'"
                  ></span>
                </div>
              </form>
            </div>
          </mat-tab>

          <!-- ── About ── -->
          <mat-tab label="About">
            <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">

              @if (isAboutNew()) {
                <div class="flex items-start gap-3 p-4 rounded-lg border"
                     style="border-color: color-mix(in srgb, currentColor 20%, transparent); background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent)">
                  <mat-icon class="shrink-0 opacity-60">info</mat-icon>
                  <p class="text-sm opacity-70">
                    No About page exists yet. Fill in the form below and save to create one.
                    The blog's <code>/about</code> route will redirect to <code>/not-found</code>
                    until <code>pages.about</code> is saved to the Firestore
                    <code>site-config/main</code> document.
                  </p>
                </div>
              }

              <form [formGroup]="aboutForm" class="flex flex-col gap-5">
                <mat-form-field appearance="outline">
                  <mat-label>Headline</mat-label>
                  <input matInput formControlName="headline" placeholder="Hi, I'm Jane" />
                  @if (aboutForm.get('headline')?.hasError('required') && aboutForm.get('headline')?.touched) {
                    <mat-error>Headline is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Subheadline</mat-label>
                  <input matInput formControlName="subheadline" placeholder="Software engineer & writer" />
                </mat-form-field>

                <!-- Photo upload -->
                <div class="flex flex-col gap-3">
                  <span class="text-sm font-medium opacity-70">Profile Photo</span>

                  @if (aboutPhotoUrl()) {
                    <div class="flex items-center gap-4">
                      <img
                        [src]="aboutPhotoUrl()"
                        alt="Profile photo preview"
                        class="w-24 h-24 rounded-full object-cover border"
                        style="border-color: color-mix(in srgb, currentColor 15%, transparent)"
                      />
                      <button mat-stroked-button type="button" (click)="removeAboutPhoto()">
                        <mat-icon>delete</mat-icon>
                        Remove
                      </button>
                    </div>
                  }

                  @if (aboutPhotoUploading()) {
                    <mat-progress-bar mode="determinate" [value]="aboutPhotoProgress()" />
                  }
                  @if (aboutPhotoError()) {
                    <p class="text-sm text-red-500">{{ aboutPhotoError() }}</p>
                  }

                  <div class="flex items-center gap-3">
                    <input
                      #photoInput
                      type="file"
                      accept="image/*"
                      class="hidden"
                      (change)="onPhotoSelected($any($event.target).files)"
                    />
                    <button
                      mat-stroked-button
                      type="button"
                      [disabled]="aboutPhotoUploading() || !isBrowser"
                      (click)="photoInput.click()"
                    >
                      <mat-icon>upload</mat-icon>
                      {{ aboutPhotoUrl() ? 'Replace Photo' : 'Upload Photo' }}
                    </button>
                  </div>
                </div>

                <mat-form-field appearance="outline">
                  <mat-label>Photo Alt Text</mat-label>
                  <input matInput formControlName="photoAlt" placeholder="Jane Doe smiling" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Bio</mat-label>
                  <textarea
                    matInput
                    formControlName="bio"
                    rows="8"
                    placeholder="Write your bio in Markdown…"
                  ></textarea>
                  <mat-hint>Supports Markdown</mat-hint>
                  @if (aboutForm.get('bio')?.hasError('required') && aboutForm.get('bio')?.touched) {
                    <mat-error>Bio is required</mat-error>
                  }
                </mat-form-field>
              </form>

              <!-- About social links -->
              <div class="flex flex-col gap-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold">Social Links</span>
                  <button mat-stroked-button type="button" (click)="addAboutSocialLink()">
                    <mat-icon>add</mat-icon>
                    Add Link
                  </button>
                </div>

                <div [formGroup]="aboutSocialForm" class="flex flex-col gap-3">
                  <div formArrayName="socialLinks" class="flex flex-col gap-3">
                    @for (ctrl of aboutSocialLinksArray.controls; track $index) {
                      <div
                        [formGroupName]="$index"
                        class="flex items-start gap-2 p-3 rounded-lg border"
                        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
                      >
                        <mat-form-field appearance="outline" class="w-40 shrink-0">
                          <mat-label>Platform</mat-label>
                          <mat-select formControlName="platform">
                            @for (p of platforms; track p.value) {
                              <mat-option [value]="p.value">{{ p.label }}</mat-option>
                            }
                          </mat-select>
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="flex-1">
                          <mat-label>Label</mat-label>
                          <input matInput formControlName="label" placeholder="Optional label" />
                        </mat-form-field>

                        <mat-form-field appearance="outline" class="flex-1">
                          <mat-label>URL</mat-label>
                          <input matInput formControlName="url" placeholder="https://…" />
                        </mat-form-field>

                        <button
                          mat-icon-button
                          type="button"
                          class="shrink-0 mt-1"
                          matTooltip="Remove"
                          (click)="removeAboutSocialLink($index)"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    }
                    @if (!aboutSocialLinksArray.length) {
                      <p class="text-sm opacity-50 text-center py-4">
                        No social links yet.
                      </p>
                    }
                  </div>
                </div>
              </div>

              <!-- About SEO -->
              <div class="flex flex-col gap-4">
                <span class="text-sm font-semibold">SEO</span>
                <form [formGroup]="aboutSeoForm" class="flex flex-col gap-5">
                  <mat-form-field appearance="outline">
                    <mat-label>Meta Title</mat-label>
                    <input matInput formControlName="title" placeholder="About — My Blog" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Meta Description</mat-label>
                    <textarea matInput formControlName="description" rows="3"
                              placeholder="A brief description for search engines…"></textarea>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>OG Image URL</mat-label>
                    <input matInput formControlName="ogImage" placeholder="https://…/og.jpg" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Canonical URL</mat-label>
                    <input matInput formControlName="canonicalUrl" placeholder="https://example.com/about" />
                  </mat-form-field>
                </form>
              </div>

            </div>
          </mat-tab>

        </mat-tab-group>

        <!-- Sticky footer: save / discard -->
        @if (store.isDirty()) {
          <div class="flex items-center justify-end gap-3 px-6 py-3 border-t shrink-0"
               style="border-color: color-mix(in srgb, currentColor 12%, transparent); background: var(--mat-sys-surface)">
            <span class="text-sm opacity-60 flex-1">You have unsaved changes.</span>
            <button mat-stroked-button [disabled]="store.isSaving()" (click)="onDiscard()">
              Discard
            </button>
            <button mat-flat-button [disabled]="hasInvalidForms() || store.isSaving()" (click)="onSave()">
              {{ isAboutNew() ? 'Create About page' : 'Save Changes' }}
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class SiteConfigComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  private readonly authorService = inject(AuthorService);
  private readonly fb = inject(FormBuilder);
  private readonly storage = inject(FIREBASE_STORAGE);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly router = inject(Router);

  protected readonly isBrowser = isPlatformBrowser(this.platformId);
  protected readonly platforms = SOCIAL_PLATFORMS;

  protected readonly authors = toSignal(this.authorService.getAll(), { initialValue: [] });

  // Photo upload state
  protected readonly aboutPhotoUrl = signal<string | undefined>(undefined);
  protected readonly aboutPhotoUploading = signal(false);
  protected readonly aboutPhotoProgress = signal(0);
  protected readonly aboutPhotoError = signal<string | null>(null);

  protected readonly isAboutNew = computed(() => !this.store.config()?.pages?.about);

  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  // ── Forms ──────────────────────────────────────────────────────────────────

  protected readonly generalForm: FormGroup = this.fb.group({
    siteName: ['', Validators.required],
    siteUrl: ['', Validators.required],
    defaultAuthorId: [null as string | null],
  });

  protected readonly navForm: FormGroup = this.fb.group({
    navItems: this.fb.array([]),
  });

  protected readonly seoForm: FormGroup = this.fb.group({
    title: [''],
    description: [''],
    ogImage: [''],
    canonicalUrl: [''],
  });

  protected readonly themeForm: FormGroup = this.fb.group({
    primaryColor: [''],
    accentColor: [''],
  });

  protected readonly aboutForm: FormGroup = this.fb.group({
    headline: ['', Validators.required],
    subheadline: [''],
    bio: ['', Validators.required],
    photoAlt: [''],
  });

  protected readonly aboutSocialForm: FormGroup = this.fb.group({
    socialLinks: this.fb.array([]),
  });

  protected readonly aboutSeoForm: FormGroup = this.fb.group({
    title: [''],
    description: [''],
    ogImage: [''],
    canonicalUrl: [''],
  });

  get navItemsArray(): FormArray {
    return this.navForm.get('navItems') as FormArray;
  }

  get aboutSocialLinksArray(): FormArray {
    return this.aboutSocialForm.get('socialLinks') as FormArray;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.store.load();

    const pollInterval = setInterval(() => {
      const config = this.store.config();
      if (!config) return;
      clearInterval(pollInterval);
      this.populateForms(config);
      this.watchForms();
    }, 50);
  }

  // ── Tab change: flush current form to store ─────────────────────────────

  protected onTabChange(): void {
    this.flushFormsToStore();
  }

  // ── Nav drag-drop ──────────────────────────────────────────────────────────

  protected onNavDrop(event: CdkDragDrop<FormGroup[]>): void {
    const controls = this.navItemsArray.controls;
    moveItemInArray(controls, event.previousIndex, event.currentIndex);
    this.navItemsArray.setValue(controls.map((c) => c.value));
    this.flushNavToStore();
  }

  protected addNavItem(): void {
    this.navItemsArray.push(
      this.fb.group({ label: [''], url: [''], icon: [''], external: [false] }),
    );
  }

  protected removeNavItem(index: number): void {
    this.navItemsArray.removeAt(index);
    this.flushNavToStore();
  }

  // ── About social links ─────────────────────────────────────────────────────

  protected addAboutSocialLink(): void {
    this.aboutSocialLinksArray.push(
      this.fb.group({ platform: ['website'], label: [''], url: [''] }),
    );
  }

  protected removeAboutSocialLink(index: number): void {
    this.aboutSocialLinksArray.removeAt(index);
    this.flushAboutToStore();
  }

  // ── Photo upload ───────────────────────────────────────────────────────────

  protected onPhotoSelected(files: FileList | null): void {
    if (!files?.length) return;
    this.uploadAboutPhoto(files[0]);
  }

  protected removeAboutPhoto(): void {
    this.aboutPhotoUrl.set(undefined);
    this.flushAboutToStore();
  }

  private uploadAboutPhoto(file: File): void {
    if (!this.storage) return;
    const path = `site-config/about/photo/${file.name}`;

    this.aboutPhotoUploading.set(true);
    this.aboutPhotoProgress.set(0);
    this.aboutPhotoError.set(null);

    const fileRef = ref(this.storage, path);
    const task = uploadBytesResumable(fileRef, file);

    task.on(
      'state_changed',
      (snapshot) => {
        this.aboutPhotoProgress.set(
          Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        );
      },
      (error) => {
        this.aboutPhotoUploading.set(false);
        this.aboutPhotoError.set(error.message);
      },
      () => {
        getDownloadURL(task.snapshot.ref).then((downloadUrl) => {
          this.aboutPhotoUrl.set(downloadUrl);
          this.aboutPhotoUploading.set(false);
          this.flushAboutToStore();
        });
      },
    );
  }

  // ── Save / discard ─────────────────────────────────────────────────────────

  protected hasInvalidForms(): boolean {
    return this.generalForm.invalid || this.seoForm.invalid || this.aboutForm.invalid;
  }

  protected onSave(): void {
    this.flushFormsToStore();
    this.store.save();
  }

  protected onDiscard(): void {
    this.store.discard();
    const config = this.store.config();
    if (config) this.populateForms(config);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  protected asFormGroup(ctrl: unknown): FormGroup {
    return ctrl as FormGroup;
  }

  private populateForms(config: ReturnType<typeof this.store.config>): void {
    if (!config) return;

    this.generalForm.patchValue({
      siteName: config.siteName ?? '',
      siteUrl: config.siteUrl ?? '',
      defaultAuthorId: config.defaultAuthorId ?? null,
    }, { emitEvent: false });

    this.navItemsArray.clear({ emitEvent: false });
    for (const item of config.nav ?? []) {
      this.navItemsArray.push(
        this.fb.group({
          label: [item.label ?? ''],
          url: [item.url ?? ''],
          icon: [item.icon ?? ''],
          external: [item.external ?? false],
        }),
        { emitEvent: false },
      );
    }

    this.seoForm.patchValue({
      title: config.defaultSeo?.title ?? '',
      description: config.defaultSeo?.description ?? '',
      ogImage: config.defaultSeo?.ogImage ?? '',
      canonicalUrl: config.defaultSeo?.canonicalUrl ?? '',
    }, { emitEvent: false });

    this.themeForm.patchValue({
      primaryColor: config.primaryColor ?? '',
      accentColor: config.accentColor ?? '',
    }, { emitEvent: false });

    // About page
    const about = config.pages?.about;
    this.aboutForm.patchValue({
      headline: about?.headline ?? '',
      subheadline: about?.subheadline ?? '',
      bio: about?.bio ?? '',
      photoAlt: about?.photoAlt ?? '',
    }, { emitEvent: false });

    this.aboutPhotoUrl.set(about?.photoUrl);

    this.aboutSocialLinksArray.clear({ emitEvent: false });
    for (const link of about?.socialLinks ?? []) {
      this.aboutSocialLinksArray.push(
        this.fb.group({
          platform: [link.platform],
          label: [link.label ?? ''],
          url: [link.url ?? ''],
        }),
        { emitEvent: false },
      );
    }

    this.aboutSeoForm.patchValue({
      title: about?.seo?.title ?? '',
      description: about?.seo?.description ?? '',
      ogImage: about?.seo?.ogImage ?? '',
      canonicalUrl: about?.seo?.canonicalUrl ?? '',
    }, { emitEvent: false });
  }

  private watchForms(): void {
    this.generalForm.valueChanges.subscribe((val) => {
      this.store.updateField('siteName', val.siteName ?? '');
      this.store.updateField('siteUrl', val.siteUrl ?? '');
      this.store.updateField('defaultAuthorId', val.defaultAuthorId ?? undefined);
    });

    this.navItemsArray.valueChanges.subscribe(() => this.flushNavToStore());

    this.seoForm.valueChanges.subscribe((val) => {
      this.store.updateField('defaultSeo', {
        title: val.title || undefined,
        description: val.description || undefined,
        ogImage: val.ogImage || undefined,
        canonicalUrl: val.canonicalUrl || undefined,
      });
    });

    this.themeForm.valueChanges.subscribe((val) => {
      this.store.updateField('primaryColor', val.primaryColor || undefined);
      this.store.updateField('accentColor', val.accentColor || undefined);
    });

    this.aboutForm.valueChanges.subscribe(() => this.flushAboutToStore());
    this.aboutSocialForm.valueChanges.subscribe(() => this.flushAboutToStore());
    this.aboutSeoForm.valueChanges.subscribe(() => this.flushAboutToStore());
  }

  private flushNavToStore(): void {
    const items: NavItem[] = this.navItemsArray.value.map(
      (v: { label: string; url: string; icon: string; external: boolean }) => ({
        label: v.label,
        url: v.url,
        icon: v.icon || undefined,
        external: v.external || undefined,
      }),
    );
    this.store.updateNav(items);
  }

  private flushAboutToStore(): void {
    const formVal = this.aboutForm.value as {
      headline: string;
      subheadline: string;
      bio: string;
      photoAlt: string;
    };
    const seoVal = this.aboutSeoForm.value as {
      title: string;
      description: string;
      ogImage: string;
      canonicalUrl: string;
    };
    const socialLinks: SocialLink[] = this.aboutSocialLinksArray.value.map(
      (v: { platform: SocialPlatform; label: string; url: string }) => ({
        platform: v.platform,
        label: v.label || undefined,
        url: v.url,
      }),
    );

    const about: AboutPageConfig = {
      headline: formVal.headline ?? '',
      subheadline: formVal.subheadline || undefined,
      bio: formVal.bio ?? '',
      photoUrl: this.aboutPhotoUrl() || undefined,
      photoAlt: formVal.photoAlt || undefined,
      socialLinks: socialLinks.length ? socialLinks : undefined,
      seo: {
        title: seoVal.title || undefined,
        description: seoVal.description || undefined,
        ogImage: seoVal.ogImage || undefined,
        canonicalUrl: seoVal.canonicalUrl || undefined,
      },
    };

    this.store.updateAbout(about);
  }

  private flushFormsToStore(): void {
    this.flushNavToStore();
    this.flushAboutToStore();
  }
}
