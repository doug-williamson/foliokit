import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { startWith } from 'rxjs/operators';
import {
  RhombusAccordionComponent,
  RhombusAccordionPanelComponent,
  RhombusCheckboxComponent,
  RhombusInputComponent,
  RhombusPageHeaderComponent,
  RhombusSpinnerComponent,
  RhombusSwitchComponent,
} from '@rhombuskit/core';
import type { SiteConfig } from '@foliokit/cms-core';
import {
  SeoFieldsComponent,
  type SeoFieldsFormGroup,
} from '../components/seo-fields/seo-fields.component';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';
import { wireSiteConfigSaveSnackbarFeedback } from '../site-config-editor/site-config-save-snackbar.util';
import { SaveBarComponent } from '../components/save-bar/save-bar.component';

/**
 * Edits `pages.home` (hero, CTA, recent posts block). Uses the same
 * `SiteConfigEditorStore` instance as the `pages` route parent.
 */
@Component({
  selector: 'folio-home-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RhombusAccordionComponent,
    RhombusAccordionPanelComponent,
    RhombusCheckboxComponent,
    RhombusInputComponent,
    RhombusPageHeaderComponent,
    RhombusSpinnerComponent,
    RhombusSwitchComponent,
    SeoFieldsComponent,
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
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden relative">
      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <rhombus-spinner [diameter]="40" />
        </div>
      } @else {
        <div class="flex-1 overflow-y-auto">
          <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
            <rhombus-page-header
              title="Home"
              description="Configure the hero visitors see on your public home page."
            />

            <form class="flex flex-col gap-5" (submit)="$event.preventDefault()">
              <div class="flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-medium m-0">Show home hero</p>
                  <p class="text-xs opacity-50 m-0 mt-0.5">
                    When off, your theme may still show a minimal landing.
                  </p>
                </div>
                <rhombus-switch
                  aria-label="Enable home hero"
                  [control]="asFc(homeForm.get('enabled'))"
                />
              </div>

              <rhombus-input
                label="Hero headline"
                placeholder="Hey, I'm Jane"
                [control]="asFc(homeForm.get('heroHeadline'))"
              >
                <span rhombusError>Headline is required when the hero is on</span>
              </rhombus-input>

              <rhombus-input
                label="Subheadline"
                placeholder="Thoughts on building products and writing software."
                [control]="asFc(homeForm.get('heroSubheadline'))"
              />

              <div class="flex flex-col sm:flex-row gap-4">
                <rhombus-input
                  class="flex-1"
                  label="CTA label"
                  placeholder="Read Posts"
                  [control]="asFc(homeForm.get('ctaLabel'))"
                />
                <rhombus-input
                  class="flex-1"
                  label="CTA URL"
                  placeholder="/posts"
                  [control]="asFc(homeForm.get('ctaUrl'))"
                />
              </div>

              <rhombus-checkbox
                label="Show recent post below the hero"
                [control]="asFc(homeForm.get('showRecentPosts'))"
              />

              <rhombus-accordion class="mt-2">
                <rhombus-accordion-panel title="SEO" description="Defaults apply if left empty.">
                  <folio-seo-fields [group]="seoGroup" />
                </rhombus-accordion-panel>
              </rhombus-accordion>
            </form>
          </div>
        </div>
      }

      <folio-save-bar
        [isDirty]="store.isDirty()"
        [isSaving]="store.isSaving()"
        [saveDisabled]="homeForm.invalid"
        (saved)="onSave()"
        (discarded)="onDiscard()"
      />
    </div>
  `,
})
export class HomePageEditorComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  /** Guards one-time form population once the store's config first resolves. */
  private populated = false;

  constructor() {
    wireSiteConfigSaveSnackbarFeedback(this.store);

    // Populate the form once, when the store's config first becomes available.
    // Replaces a setInterval(50ms) poll. populateFromConfig patches with
    // emitEvent:false, so this never feeds back into the flush subscription.
    effect(() => {
      const config = this.store.config();
      if (!config || this.populated) return;
      this.populated = true;
      this.populateFromConfig(config);
    });
  }

  protected readonly homeForm: FormGroup = this.fb.group({
    enabled: [true],
    heroHeadline: [''],
    heroSubheadline: [''],
    ctaLabel: [''],
    ctaUrl: [''],
    showRecentPosts: [false],
    seo: this.fb.group({
      metaTitle: new FormControl<string | null>(null),
      metaDescription: new FormControl<string | null>(null),
      ogImageUrl: new FormControl<string | null>(null),
      canonicalUrl: new FormControl<string | null>(null),
    }),
  });

  protected get seoGroup(): SeoFieldsFormGroup {
    return this.homeForm.get('seo') as SeoFieldsFormGroup;
  }

  /** Narrow an `AbstractControl` to `FormControl` for RhombusKit's `[control]` input. */
  protected asFc(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }

  ngOnInit(): void {
    this.store.load();

    this.homeForm
      .get('enabled')!
      .valueChanges.pipe(
        startWith(this.homeForm.get('enabled')!.value),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((on: boolean) => {
        const h = this.homeForm.get('heroHeadline');
        if (on) {
          h?.setValidators([Validators.required]);
        } else {
          h?.clearValidators();
        }
        h?.updateValueAndValidity({ emitEvent: false });
      });

    this.homeForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.flushToStore());
  }

  protected onSave(): void {
    this.flushToStore();
    this.store.save();
  }

  protected onDiscard(): void {
    this.store.discard();
    const config = this.store.config();
    if (config) this.populateFromConfig(config);
  }

  private populateFromConfig(config: SiteConfig): void {
    const home = config.pages?.home;
    const seo = home?.seo;
    this.homeForm.patchValue(
      {
        enabled: home?.enabled ?? false,
        heroHeadline: home?.heroHeadline ?? '',
        heroSubheadline: home?.heroSubheadline ?? '',
        ctaLabel: home?.ctaLabel ?? '',
        ctaUrl: home?.ctaUrl ?? '',
        showRecentPosts: home?.showRecentPosts ?? false,
        seo: {
          metaTitle: seo?.title ?? null,
          metaDescription: seo?.description ?? null,
          ogImageUrl: seo?.ogImage ?? null,
          canonicalUrl: seo?.canonicalUrl ?? null,
        },
      },
      { emitEvent: false },
    );
    this.homeForm.get('heroHeadline')?.updateValueAndValidity({ emitEvent: false });
  }

  private flushToStore(): void {
    const v = this.homeForm.getRawValue() as {
      enabled: boolean;
      heroHeadline: string;
      heroSubheadline: string;
      ctaLabel: string;
      ctaUrl: string;
      showRecentPosts: boolean;
      seo: {
        metaTitle: string | null;
        metaDescription: string | null;
        ogImageUrl: string | null;
        canonicalUrl: string | null;
      };
    };
    const prev = this.store.config()?.pages?.home;
    this.store.setHomePage({
      enabled: v.enabled,
      heroHeadline: (v.heroHeadline ?? '').trim(),
      heroSubheadline: v.heroSubheadline?.trim() || undefined,
      ctaLabel: v.ctaLabel?.trim() || undefined,
      ctaUrl: v.ctaUrl?.trim() || undefined,
      showRecentPosts: v.showRecentPosts || undefined,
      seo: {
        ...prev?.seo,
        title: v.seo.metaTitle ?? '',
        description: v.seo.metaDescription ?? '',
        ogImage: v.seo.ogImageUrl ?? '',
        canonicalUrl: v.seo.canonicalUrl ?? '',
      },
    });
  }
}
