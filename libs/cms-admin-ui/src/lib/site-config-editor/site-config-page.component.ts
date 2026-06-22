import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { IMAGE_UPLOAD_METADATA } from '../shared/upload-metadata';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthorService, CollectionPaths, SiteProfile, SocialLink, SocialPlatform } from '@foliokit/cms-core';
import {
  RhombusButtonComponent,
  RhombusInputComponent,
  RhombusSelectComponent,
  RhombusSpinnerComponent,
  RhombusTabGroupDirective,
  RhombusTextareaComponent,
  RhombusTooltipDirective,
  type SelectOption,
} from '@rhombuskit/core';
import { SiteConfigEditorStore } from './site-config-editor.store';
import { wireSiteConfigSaveSnackbarFeedback } from './site-config-save-snackbar.util';
import { SaveBarComponent } from '../components/save-bar/save-bar.component';

/**
 * Site settings: General, default SEO, and Pro (billing / domain).
 *
 * `SiteConfigEditorStore` must be provided at the route level. Header nav links
 * are configured during setup; there is no Navigation tab here.
 */
@Component({
  selector: 'folio-site-config-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    RhombusButtonComponent,
    RhombusInputComponent,
    RhombusSelectComponent,
    RhombusSpinnerComponent,
    RhombusTabGroupDirective,
    RhombusTextareaComponent,
    RhombusTooltipDirective,
    SaveBarComponent,
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
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden relative">
      <div
        class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <h1 class="page-heading flex-1">Settings</h1>
      </div>

      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <rhombus-spinner [diameter]="40" />
        </div>
      } @else {
        <mat-tab-group
          rhombusTabGroup
          class="flex flex-col flex-1 overflow-hidden"
          [mat-stretch-tabs]="true"
          animationDuration="0"
        >
          <mat-tab label="General">
            <div class="flex flex-col gap-6 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <form class="flex flex-col gap-5" (submit)="$event.preventDefault()">
                <rhombus-input
                  label="Site Name"
                  placeholder="My Blog"
                  [control]="asFc(generalForm.get('siteName'))"
                >
                  <span rhombusError>Site name is required</span>
                </rhombus-input>

                <rhombus-input
                  label="Site URL"
                  placeholder="https://example.com"
                  [control]="asFc(generalForm.get('siteUrl'))"
                >
                  <span rhombusError>Site URL is required</span>
                </rhombus-input>

                <div>
                  <rhombus-select
                    label="Default Author"
                    [options]="authorOptions()"
                    [control]="asFc(generalForm.get('defaultAuthorId'))"
                  />
                  @if (!authors().length) {
                    <p class="text-xs opacity-60 mt-1 mb-0">
                      No authors yet.
                      <a routerLink="/authors/new" class="underline">Create one</a>
                    </p>
                  }
                </div>
              </form>

              <div class="flex flex-col gap-4">
                <h3 class="text-sm font-semibold opacity-80 m-0">Site Profile</h3>

                <div class="flex justify-around sm:justify-center sm:gap-24 py-2">
                  <div class="flex flex-col items-center gap-3">
                    <div
                      class="w-24 h-24 sm:w-[120px] sm:h-[120px] rounded-full overflow-hidden shrink-0 flex items-center justify-center border"
                      style="background: #64748b; border-color: color-mix(in srgb, currentColor 14%, transparent)"
                    >
                      @if (profilePhotoUrl()) {
                        <img
                          [src]="profilePhotoUrl()!"
                          [alt]="profileForm.get('photoAlt')?.value ?? 'Profile photo'"
                          class="w-full h-full object-cover"
                        />
                      }
                    </div>
                    <span class="text-xs opacity-60 leading-none">Light mode</span>
                    <label class="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        (change)="onProfilePhotoSelected($event, 'light')"
                      />
                      <span class="mat-mdc-button mat-mdc-outlined-button text-xs cursor-pointer">
                        @if (photoUploadState() === 'uploading') {
                          <rhombus-spinner [diameter]="14" style="display: inline-block" /> Uploading…
                        } @else {
                          Upload
                        }
                      </span>
                    </label>
                  </div>

                  <div class="flex flex-col items-center gap-3">
                    <div
                      class="w-24 h-24 sm:w-[120px] sm:h-[120px] rounded-full overflow-hidden shrink-0 flex items-center justify-center border"
                      style="background: #0f172a; border-color: color-mix(in srgb, currentColor 14%, transparent)"
                    >
                      @if (profilePhotoDarkUrl()) {
                        <img
                          [src]="profilePhotoDarkUrl()!"
                          [alt]="profileForm.get('photoAlt')?.value ?? 'Profile photo (dark)'"
                          class="w-full h-full object-cover"
                        />
                      }
                    </div>
                    <span class="text-xs opacity-60 leading-none">Dark mode</span>
                    <label class="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        (change)="onProfilePhotoSelected($event, 'dark')"
                      />
                      <span class="mat-mdc-button mat-mdc-outlined-button text-xs cursor-pointer">
                        @if (photoDarkUploadState() === 'uploading') {
                          <rhombus-spinner [diameter]="14" style="display: inline-block" /> Uploading…
                        } @else {
                          Upload
                        }
                      </span>
                    </label>
                  </div>
                </div>

                <form class="flex flex-col gap-4" (submit)="$event.preventDefault()">
                  <rhombus-input
                    label="Display Name"
                    placeholder="Jane Smith"
                    [control]="asFc(profileForm.get('displayName'))"
                  />

                  <rhombus-input
                    label="Photo Alt Text"
                    placeholder="Headshot of Jane Smith"
                    [control]="asFc(profileForm.get('photoAlt'))"
                  />
                </form>

                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold opacity-70">Social Links</span>
                  <rhombus-button appearance="outlined" type="button" (click)="addProfileSocialLink()">
                    <mat-icon svgIcon="add" />
                    Add
                  </rhombus-button>
                </div>

                <div class="flex flex-col gap-3">
                  @for (group of profileSocialLinksArray.controls; track $index) {
                    <div
                      class="flex flex-col gap-2 p-3 rounded-lg border"
                      style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
                    >
                      <div class="flex items-start gap-2">
                        <rhombus-select
                          class="flex-1"
                          label="Platform"
                          [options]="platforms"
                          [control]="asFc(group.get('platform'))"
                        />
                        <button
                          mat-icon-button
                          type="button"
                          class="shrink-0 mt-1"
                          rhombusTooltip="Remove"
                          (click)="removeProfileSocialLink($index)"
                        >
                          <mat-icon svgIcon="delete" />
                        </button>
                      </div>
                      <div class="flex gap-2">
                        <rhombus-input
                          class="flex-1"
                          label="Label"
                          placeholder="Optional"
                          [control]="asFc(group.get('label'))"
                        />
                        <rhombus-input
                          class="flex-1"
                          label="URL"
                          placeholder="https://…"
                          [control]="asFc(group.get('url'))"
                        />
                      </div>
                    </div>
                  }
                  @if (!profileSocialLinksArray.length) {
                    <p class="text-sm opacity-50 text-center py-2 m-0">No social links yet.</p>
                  }
                </div>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="SEO">
            <div class="flex flex-col gap-6 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <form class="flex flex-col gap-5" (submit)="$event.preventDefault()">
                <rhombus-input
                  label="Meta Title"
                  placeholder="My Awesome Blog"
                  [control]="asFc(seoForm.get('title'))"
                />

                <rhombus-textarea
                  label="Meta Description"
                  placeholder="A brief description of your site…"
                  [rows]="3"
                  [control]="asFc(seoForm.get('description'))"
                />

                <rhombus-input
                  label="OG Image URL"
                  placeholder="https://…/og.jpg"
                  [control]="asFc(seoForm.get('ogImage'))"
                />

                <rhombus-input
                  label="Canonical URL"
                  placeholder="https://example.com"
                  [control]="asFc(seoForm.get('canonicalUrl'))"
                />
              </form>
            </div>
          </mat-tab>

          <!-- GATE_TODO: pro tab -->
        </mat-tab-group>
      }

      <folio-save-bar
        [isDirty]="store.isDirty()"
        [isSaving]="store.isSaving()"
        [saveDisabled]="hasInvalidForms()"
        (saved)="onSave()"
        (discarded)="onDiscard()"
      />
    </div>
  `,
})
export class SiteConfigPageComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  private readonly authorService = inject(AuthorService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  /** Guards one-time form population + watcher wiring once config resolves. */
  private populated = false;

  protected readonly authors = toSignal(this.authorService.getAll(), { initialValue: [] });

  /** Default-author options: a leading "none" entry plus one per author. */
  protected readonly authorOptions = computed<SelectOption<string | null>[]>(() => [
    { value: null, label: '— None —' },
    ...this.authors().map((a) => ({ value: a.id, label: a.displayName })),
  ]);

  private readonly paths = inject(CollectionPaths);

  protected readonly profilePhotoUrl = signal<string | null>(null);
  protected readonly profilePhotoDarkUrl = signal<string | null>(null);
  protected readonly photoUploadState = signal<'idle' | 'uploading'>('idle');
  protected readonly photoDarkUploadState = signal<'idle' | 'uploading'>('idle');

  protected readonly profileForm: FormGroup = this.fb.group({
    displayName: new FormControl<string | null>(null),
    photoAlt: new FormControl<string | null>(null),
  });

  protected readonly profileSocialForm: FormGroup = this.fb.group({
    socialLinks: this.fb.array([]),
  });

  protected readonly platforms: { value: SocialPlatform; label: string }[] = [
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

  get profileSocialLinksArray(): FormArray {
    return this.profileSocialForm.get('socialLinks') as FormArray;
  }

  /** Narrow an `AbstractControl` to `FormControl` for RhombusKit's `[control]` input. */
  protected asFc(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }

  protected readonly generalForm: FormGroup = this.fb.group({
    siteName: ['', Validators.required],
    siteUrl: ['', Validators.required],
    defaultAuthorId: [null as string | null],
  });

  protected readonly seoForm: FormGroup = this.fb.group({
    title: [''],
    description: [''],
    ogImage: [''],
    canonicalUrl: [''],
  });

  constructor() {
    wireSiteConfigSaveSnackbarFeedback(this.store);

    // Populate the forms and wire change-watchers once, when the store's config
    // first resolves. Replaces a setInterval(50ms) poll.
    effect(() => {
      const config = this.store.config();
      if (!config || this.populated) return;
      this.populated = true;
      this.populateForms(config);
      this.watchForms();
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  protected hasInvalidForms(): boolean {
    return this.generalForm.invalid || this.seoForm.invalid;
  }

  protected onSave(): void {
    this.store.save();
  }

  protected onDiscard(): void {
    this.store.discard();
    const config = this.store.config();
    if (config) this.populateForms(config);
  }

  private populateForms(config: ReturnType<typeof this.store.config>): void {
    if (!config) return;

    this.generalForm.patchValue(
      {
        siteName: config.siteName ?? '',
        siteUrl: config.siteUrl ?? '',
        defaultAuthorId: config.defaultAuthorId ?? null,
      },
      { emitEvent: false },
    );

    this.seoForm.patchValue(
      {
        title: config.defaultSeo?.title ?? '',
        description: config.defaultSeo?.description ?? '',
        ogImage: config.defaultSeo?.ogImage ?? '',
        canonicalUrl: config.defaultSeo?.canonicalUrl ?? '',
      },
      { emitEvent: false },
    );

    const profile = config.profile;
    this.profileForm.patchValue(
      {
        displayName: profile?.displayName ?? null,
        photoAlt: profile?.photoAlt ?? null,
      },
      { emitEvent: false },
    );
    this.profilePhotoUrl.set(profile?.photoUrl ?? null);
    this.profilePhotoDarkUrl.set(profile?.photoUrlDark ?? null);

    this.profileSocialLinksArray.clear({ emitEvent: false });
    for (const link of profile?.socialLinks ?? []) {
      this.profileSocialLinksArray.push(
        this.fb.group({
          platform: [link.platform],
          label: [link.label ?? ''],
          url: [link.url ?? ''],
        }),
        { emitEvent: false },
      );
    }
  }

  private watchForms(): void {
    this.generalForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.store.updateField('siteName', val.siteName ?? '');
        this.store.updateField('siteUrl', val.siteUrl ?? '');
        this.store.updateField('defaultAuthorId', val.defaultAuthorId ?? undefined);
      });

    this.seoForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.store.updateField('defaultSeo', {
          title: val.title || undefined,
          description: val.description || undefined,
          ogImage: val.ogImage || undefined,
          canonicalUrl: val.canonicalUrl || undefined,
        });
      });

    this.profileForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.flushProfileToStore());
    this.profileSocialForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.flushProfileToStore());
  }

  private flushProfileToStore(): void {
    const v = this.profileForm.getRawValue() as {
      displayName: string | null;
      photoAlt: string | null;
    };
    const socialLinks: SocialLink[] = this.profileSocialLinksArray.value.map(
      (row: { platform: SocialPlatform; label: string; url: string }) => ({
        platform: row.platform,
        label: row.label || undefined,
        url: row.url,
      }),
    );
    const profile: SiteProfile = {
      displayName: v.displayName,
      photoUrl: this.profilePhotoUrl(),
      photoUrlDark: this.profilePhotoDarkUrl(),
      photoAlt: v.photoAlt,
      socialLinks: socialLinks.length ? socialLinks : undefined,
    };
    this.store.updateProfile(profile);
  }

  protected addProfileSocialLink(): void {
    this.profileSocialLinksArray.push(
      this.fb.group({ platform: ['website'], label: [''], url: [''] }),
    );
  }

  protected removeProfileSocialLink(index: number): void {
    this.profileSocialLinksArray.removeAt(index);
    this.flushProfileToStore();
  }

  protected async onProfilePhotoSelected(
    event: Event,
    variant: 'light' | 'dark',
  ): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (variant === 'light') {
      this.photoUploadState.set('uploading');
    } else {
      this.photoDarkUploadState.set('uploading');
    }
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = this.paths.storagePath(`profile/avatar-${variant}.${ext}`);
      const snapshot = await uploadBytes(ref(getStorage(), path), file, IMAGE_UPLOAD_METADATA);
      const url = await getDownloadURL(snapshot.ref);
      if (variant === 'light') {
        this.profilePhotoUrl.set(url);
      } else {
        this.profilePhotoDarkUrl.set(url);
      }
      this.flushProfileToStore();
    } finally {
      if (variant === 'light') {
        this.photoUploadState.set('idle');
      } else {
        this.photoDarkUploadState.set('idle');
      }
      input.value = '';
    }
  }
}
