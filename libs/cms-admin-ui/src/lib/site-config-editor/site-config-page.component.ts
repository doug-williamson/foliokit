import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthorService, SITE_ID, SiteProfile, SocialLink, SocialPlatform } from '@foliokit/cms-core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    MatSnackBarModule,
    MatTooltipModule,
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
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <mat-tab-group
          class="flex flex-col flex-1 overflow-hidden"
          [mat-stretch-tabs]="true"
          animationDuration="0"
        >
          <mat-tab label="General">
            <div class="flex flex-col gap-6 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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

              <div class="flex flex-col gap-4">
                <h3 class="text-sm font-semibold opacity-80 m-0">Site Profile</h3>

                <div class="flex items-center gap-4">
                  <div
                    class="w-[120px] h-[120px] rounded-full overflow-hidden shrink-0 flex items-center justify-center border"
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
                  <div class="flex flex-col gap-2">
                    <label class="text-xs opacity-60">Light mode photo</label>
                    <label class="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        (change)="onProfilePhotoSelected($event, 'light')"
                      />
                      <span class="mat-mdc-button mat-mdc-outlined-button text-xs cursor-pointer">
                        @if (photoUploadState() === 'uploading') {
                          <mat-spinner diameter="14" style="display: inline-block" /> Uploading…
                        } @else {
                          Upload photo
                        }
                      </span>
                    </label>
                    <label class="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        class="hidden"
                        (change)="onProfilePhotoSelected($event, 'dark')"
                      />
                      <span class="mat-mdc-button mat-mdc-outlined-button text-xs cursor-pointer">
                        @if (photoDarkUploadState() === 'uploading') {
                          <mat-spinner diameter="14" style="display: inline-block" /> Uploading…
                        } @else {
                          Upload dark mode photo
                        }
                      </span>
                    </label>
                  </div>
                </div>

                <form [formGroup]="profileForm" class="flex flex-col gap-4">
                  <mat-form-field appearance="outline">
                    <mat-label>Display Name</mat-label>
                    <input matInput formControlName="displayName" placeholder="Jane Smith" />
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Photo Alt Text</mat-label>
                    <input matInput formControlName="photoAlt" placeholder="Headshot of Jane Smith" />
                  </mat-form-field>
                </form>

                <div class="flex items-center justify-between">
                  <span class="text-xs font-semibold opacity-70">Social Links</span>
                  <button mat-stroked-button type="button" (click)="addProfileSocialLink()">
                    <mat-icon svgIcon="add" />
                    Add
                  </button>
                </div>

                <div [formGroup]="profileSocialForm" class="flex flex-col gap-3">
                  <div formArrayName="socialLinks" class="flex flex-col gap-3">
                    @for (ctrl of profileSocialLinksArray.controls; track $index) {
                      <div
                        [formGroupName]="$index"
                        class="flex flex-col gap-2 p-3 rounded-lg border"
                        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
                      >
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
                            (click)="removeProfileSocialLink($index)"
                          >
                            <mat-icon svgIcon="delete" />
                          </button>
                        </div>
                        <div class="flex gap-2">
                          <mat-form-field appearance="outline" class="flex-1">
                            <mat-label>Label</mat-label>
                            <input matInput formControlName="label" placeholder="Optional" />
                          </mat-form-field>
                          <mat-form-field appearance="outline" class="flex-1">
                            <mat-label>URL</mat-label>
                            <input matInput formControlName="url" placeholder="https://…" />
                          </mat-form-field>
                        </div>
                      </div>
                    }
                    @if (!profileSocialLinksArray.length) {
                      <p class="text-sm opacity-50 text-center py-2 m-0">No social links yet.</p>
                    }
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="SEO">
            <div class="flex flex-col gap-6 max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
              <form [formGroup]="seoForm" class="flex flex-col gap-5">
                <mat-form-field appearance="outline">
                  <mat-label>Meta Title</mat-label>
                  <input matInput formControlName="title" placeholder="My Awesome Blog" />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Meta Description</mat-label>
                  <textarea
                    matInput
                    formControlName="description"
                    rows="3"
                    placeholder="A brief description of your site…"
                  ></textarea>
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly authorService = inject(AuthorService);
  private readonly fb = inject(FormBuilder);

  protected readonly authors = toSignal(this.authorService.getAll(), { initialValue: [] });

  private readonly siteId = inject(SITE_ID, { optional: true }) ?? 'default';

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
    wireSiteConfigSaveSnackbarFeedback(this.store, this.snackBar);
  }

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
    this.generalForm.valueChanges.subscribe((val) => {
      this.store.updateField('siteName', val.siteName ?? '');
      this.store.updateField('siteUrl', val.siteUrl ?? '');
      this.store.updateField('defaultAuthorId', val.defaultAuthorId ?? undefined);
    });

    this.seoForm.valueChanges.subscribe((val) => {
      this.store.updateField('defaultSeo', {
        title: val.title || undefined,
        description: val.description || undefined,
        ogImage: val.ogImage || undefined,
        canonicalUrl: val.canonicalUrl || undefined,
      });
    });

    this.profileForm.valueChanges.subscribe(() => this.flushProfileToStore());
    this.profileSocialForm.valueChanges.subscribe(() => this.flushProfileToStore());
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
      const path = `sites/${this.siteId}/profile/avatar-${variant}.${ext}`;
      const snapshot = await uploadBytes(ref(getStorage(), path), file);
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
