import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
    ReactiveFormsModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSnackBarModule,
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
      <div
        class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <h1 class="page-heading flex-1">Home</h1>
      </div>

      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <div class="flex-1 overflow-y-auto">
          <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
            <p class="text-sm opacity-60 m-0">
              Configure the hero visitors see on your public home page.
            </p>

            <form [formGroup]="homeForm" class="flex flex-col gap-5">
              <div class="flex items-center justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-medium m-0">Show home hero</p>
                  <p class="text-xs opacity-50 m-0 mt-0.5">
                    When off, your theme may still show a minimal landing.
                  </p>
                </div>
                <mat-slide-toggle formControlName="enabled" aria-label="Enable home hero" />
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Hero headline</mat-label>
                <input matInput formControlName="heroHeadline" placeholder="Hey, I'm Jane" />
                @if (homeForm.get('heroHeadline')?.hasError('required') && homeForm.get('heroHeadline')?.touched) {
                  <mat-error>Headline is required when the hero is on</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Subheadline</mat-label>
                <input
                  matInput
                  formControlName="heroSubheadline"
                  placeholder="Thoughts on building products and writing software."
                />
              </mat-form-field>

              <div class="flex flex-col sm:flex-row gap-4">
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>CTA label</mat-label>
                  <input matInput formControlName="ctaLabel" placeholder="Read Posts" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="flex-1">
                  <mat-label>CTA URL</mat-label>
                  <input matInput formControlName="ctaUrl" placeholder="/posts" />
                </mat-form-field>
              </div>

              <mat-checkbox formControlName="showRecentPosts">
                Show recent posts below the hero
              </mat-checkbox>

              <mat-expansion-panel [expanded]="false" togglePosition="after" class="!shadow-none mt-2"
                style="border: 1px solid color-mix(in srgb, currentColor 12%, transparent); border-radius: 8px">
                <mat-expansion-panel-header>
                  <mat-panel-title>SEO</mat-panel-title>
                  <mat-panel-description class="text-xs opacity-60 flex items-center">
                    Defaults apply if left empty.
                  </mat-panel-description>
                </mat-expansion-panel-header>
                <folio-seo-fields [group]="seoGroup" />
              </mat-expansion-panel>
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  constructor() {
    wireSiteConfigSaveSnackbarFeedback(this.store, this.snackBar);
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

  ngOnInit(): void {
    this.store.load();

    this.homeForm
      .get('enabled')!
      .valueChanges.pipe(startWith(this.homeForm.get('enabled')!.value))
      .subscribe((on: boolean) => {
        const h = this.homeForm.get('heroHeadline');
        if (on) {
          h?.setValidators([Validators.required]);
        } else {
          h?.clearValidators();
        }
        h?.updateValueAndValidity({ emitEvent: false });
      });

    const pollInterval = setInterval(() => {
      const config = this.store.config();
      if (!config) return;
      clearInterval(pollInterval);
      this.populateFromConfig(config);
      this.homeForm.valueChanges.subscribe(() => this.flushToStore());
    }, 50);
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
        enabled: home?.enabled ?? true,
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
