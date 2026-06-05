import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import {
  RhombusButtonComponent,
  RhombusInputComponent,
  RhombusSelectComponent,
  RhombusSpinnerComponent,
  RhombusTextareaComponent,
  RhombusTooltipDirective,
} from '@rhombuskit/core';
import { SocialLink, SocialPlatform } from '@foliokit/cms-core';
import { ProfilePreviewComponent } from '../shared/profile-preview/profile-preview.component';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';
import { wireSiteConfigSaveSnackbarFeedback } from '../site-config-editor/site-config-save-snackbar.util';
import {
  SeoFieldsComponent,
  type SeoFieldsFormGroup,
} from '../components/seo-fields/seo-fields.component';
import { SaveBarComponent } from '../components/save-bar/save-bar.component';

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
 * About page editor — headline, bio, social links form array, and per-page SEO.
 * Profile photo is edited from the Author profile (see Content tab callout).
 *
 * `SiteConfigEditorStore` must be provided at the route level (already
 * wired in `adminRoutes`). The component calls `store.load()` on init.
 */
@Component({
  selector: 'folio-about-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatTabsModule,
    RhombusButtonComponent,
    RhombusInputComponent,
    RhombusSelectComponent,
    RhombusSpinnerComponent,
    RhombusTextareaComponent,
    RhombusTooltipDirective,
    SeoFieldsComponent,
    SaveBarComponent,
    ProfilePreviewComponent,
  ],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      ::ng-deep .about-tabs .mat-mdc-tab-body-wrapper {
        flex: 1;
        overflow: hidden;
      }
      ::ng-deep .about-tabs .mat-mdc-tab-body-content {
        height: 100%;
        overflow-y: auto;
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden relative">
      <div class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
           style="border-color: color-mix(in srgb, currentColor 12%, transparent)">
        <h1 class="page-heading flex-1">About Page</h1>
      </div>

      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <rhombus-spinner [diameter]="40" />
        </div>
      } @else {
        <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
          @if (isAboutNew()) {
            <div class="shrink-0 px-6 pt-6 max-w-2xl w-full mx-auto">
              <div class="flex items-start gap-3 p-4 rounded-lg border"
                   style="border-color: color-mix(in srgb, currentColor 20%, transparent); background: color-mix(in srgb, var(--mat-sys-primary) 8%, transparent)">
                <mat-icon class="shrink-0 opacity-60" svgIcon="info" />
                <p class="text-sm opacity-70 m-0">
                  No About page exists yet. Fill in the form below and save to create one.
                  The blog's <code>/about</code> route will redirect to <code>/not-found</code>
                  until <code>pages.about</code> is saved to the Firestore
                  <code>site-config/main</code> document.
                </p>
              </div>
            </div>
          }

          <mat-tab-group
            class="flex flex-col flex-1 min-h-0 overflow-hidden about-tabs px-0"
            [mat-stretch-tabs]="true"
            color="accent"
            animationDuration="200ms"
          >
            <mat-tab label="Content">
              <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
                <folio-profile-preview
                  [profile]="store.config()?.profile ?? null"
                  settingsRoute="/settings"
                />

                <form class="flex flex-col gap-5" (submit)="$event.preventDefault()">
                  <rhombus-input
                    label="Headline"
                    placeholder="Hi, I'm Jane"
                    [control]="asFc(aboutForm.get('headline'))"
                  >
                    <span rhombusError>Headline is required</span>
                  </rhombus-input>

                  <rhombus-input
                    label="Subheadline"
                    placeholder="Software engineer & writer"
                    [control]="asFc(aboutForm.get('subheadline'))"
                  />

                  <rhombus-textarea
                    label="Bio"
                    placeholder="Write your bio in Markdown…"
                    hint="Supports Markdown"
                    [rows]="5"
                    [control]="asFc(aboutForm.get('bio'))"
                  >
                    <span rhombusError>Bio is required</span>
                  </rhombus-textarea>
                </form>

                <mat-expansion-panel class="!shadow-none">
                  <mat-expansion-panel-header>
                    <mat-panel-title class="text-sm font-medium">SEO overrides</mat-panel-title>
                  </mat-expansion-panel-header>
                  <div class="pt-2">
                    <folio-seo-fields [group]="aboutSeoForm" />
                  </div>
                </mat-expansion-panel>
              </div>
            </mat-tab>

            <mat-tab label="Links">
              <div class="flex flex-col gap-4 max-w-2xl mx-auto px-6 py-8">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold">Social Links</span>
                  <rhombus-button appearance="outlined" variant="secondary" type="button" (click)="addAboutSocialLink()">
                    <mat-icon svgIcon="add" />
                    Add Link
                  </rhombus-button>
                </div>
                <p class="text-xs opacity-60 m-0">These links appear on your About page only. To manage your full links directory, go to the Links Page editor.</p>

                <div class="flex flex-col gap-3">
                  @for (group of aboutSocialLinksArray.controls; track $index) {
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
                          (click)="removeAboutSocialLink($index)"
                        >
                          <mat-icon svgIcon="delete" />
                        </button>
                      </div>
                      <div class="flex gap-2">
                        <rhombus-input
                          class="flex-1"
                          label="Label"
                          placeholder="Optional label"
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
                  @if (!aboutSocialLinksArray.length) {
                    <p class="text-sm opacity-50 text-center py-4 m-0">
                      No social links yet.
                    </p>
                  }
                </div>
              </div>
            </mat-tab>

          </mat-tab-group>
        </div>
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
export class AboutPageEditorComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  private readonly fb = inject(FormBuilder);
  protected readonly platforms = SOCIAL_PLATFORMS;

  constructor() {
    wireSiteConfigSaveSnackbarFeedback(this.store);
  }

  protected readonly aboutPhotoUrl = signal<string | undefined>(undefined);
  protected readonly aboutPhotoDarkUrl = signal<string | undefined>(undefined);

  protected readonly isAboutNew = computed(() => !this.store.config()?.pages?.about);

  protected readonly aboutForm: FormGroup = this.fb.group({
    headline: ['', Validators.required],
    subheadline: [''],
    bio: ['', Validators.required],
    photoAlt: [''],
  });

  protected readonly aboutSocialForm: FormGroup = this.fb.group({
    socialLinks: this.fb.array([]),
  });

  protected readonly aboutSeoForm: SeoFieldsFormGroup = this.fb.group({
    metaTitle: new FormControl<string | null>(null),
    metaDescription: new FormControl<string | null>(null),
    ogImageUrl: new FormControl<string | null>(null),
    canonicalUrl: new FormControl<string | null>(null),
  }) as SeoFieldsFormGroup;

  get aboutSocialLinksArray(): FormArray {
    return this.aboutSocialForm.get('socialLinks') as FormArray;
  }

  /** Narrow an `AbstractControl` to `FormControl` for RhombusKit's `[control]` input. */
  protected asFc(control: AbstractControl | null): FormControl {
    return control as FormControl;
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

  protected addAboutSocialLink(): void {
    this.aboutSocialLinksArray.push(
      this.fb.group({ platform: ['website'], label: [''], url: [''] }),
    );
  }

  protected removeAboutSocialLink(index: number): void {
    this.aboutSocialLinksArray.removeAt(index);
    this.flushAboutToStore();
  }

  protected hasInvalidForms(): boolean {
    return this.aboutForm.invalid;
  }

  protected onSave(): void {
    this.flushAboutToStore();
    this.store.save();
  }

  protected onDiscard(): void {
    this.store.discard();
    const config = this.store.config();
    if (config) this.populateForms(config);
  }

  private populateForms(config: ReturnType<typeof this.store.config>): void {
    if (!config) return;

    const about = config.pages?.about;
    this.aboutForm.patchValue({
      headline: about?.headline ?? '',
      subheadline: about?.subheadline ?? '',
      bio: about?.bio ?? '',
      photoAlt: about?.photoAlt ?? '',
    }, { emitEvent: false });

    this.aboutPhotoUrl.set(about?.photoUrl);
    this.aboutPhotoDarkUrl.set(about?.photoUrlDark);

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

    const seo = about?.seo;
    this.aboutSeoForm.patchValue(
      {
        metaTitle: seo?.title ?? null,
        metaDescription: seo?.description ?? null,
        ogImageUrl: seo?.ogImage ?? null,
        canonicalUrl: seo?.canonicalUrl ?? null,
      },
      { emitEvent: false },
    );
  }

  private watchForms(): void {
    this.aboutForm.valueChanges.subscribe(() => this.flushAboutToStore());
    this.aboutSocialForm.valueChanges.subscribe(() => this.flushAboutToStore());
    this.aboutSeoForm.valueChanges.subscribe(() => this.flushAboutToStore());
  }

  private flushAboutToStore(): void {
    const formVal = this.aboutForm.value as {
      headline: string;
      subheadline: string;
      bio: string;
      photoAlt: string;
    };
    const seoVal = this.aboutSeoForm.getRawValue() as {
      metaTitle: string | null;
      metaDescription: string | null;
      ogImageUrl: string | null;
      canonicalUrl: string | null;
    };
    const socialLinks: SocialLink[] = this.aboutSocialLinksArray.value.map(
      (v: { platform: SocialPlatform; label: string; url: string }) => ({
        platform: v.platform,
        label: v.label || undefined,
        url: v.url,
      }),
    );

    this.store.updateAbout({
      headline: formVal.headline ?? '',
      subheadline: formVal.subheadline || undefined,
      bio: formVal.bio ?? '',
      photoUrl: this.aboutPhotoUrl() || undefined,
      photoUrlDark: this.aboutPhotoDarkUrl() || undefined,
      photoAlt: formVal.photoAlt || undefined,
      socialLinks: socialLinks.length ? socialLinks : undefined,
      seo: {
        title: seoVal.metaTitle ?? '',
        description: seoVal.metaDescription ?? '',
        ogImage: seoVal.ogImageUrl ?? '',
        canonicalUrl: seoVal.canonicalUrl ?? '',
      },
    });
  }
}
