import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { SiteConfig } from '@foliokit/cms-core';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';

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
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
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
      <div
        class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <h1 class="page-heading flex-1">Home</h1>
        @if (store.isSaving()) {
          <span class="admin-meta opacity-40">Saving...</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        }
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
            </form>
          </div>
        </div>
      }

      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-4 sm:px-6 py-3 border-t shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent); background: var(--mat-sys-surface)"
      >
        @if (store.isDirty()) {
          <span class="text-sm opacity-60 sm:flex-1">You have unsaved changes.</span>
        } @else {
          <span class="hidden sm:block sm:flex-1"></span>
        }
        <div class="flex justify-end gap-2">
          <button mat-stroked-button [disabled]="!store.isDirty() || store.isSaving()" (click)="onDiscard()">
            Cancel
          </button>
          <button
            mat-flat-button
            [disabled]="!store.isDirty() || homeForm.invalid || store.isSaving()"
            (click)="onSave()"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  `,
})
export class HomePageEditorComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  private readonly fb = inject(FormBuilder);

  protected readonly homeForm: FormGroup = this.fb.group({
    enabled: [true],
    heroHeadline: [''],
    heroSubheadline: [''],
    ctaLabel: [''],
    ctaUrl: [''],
    showRecentPosts: [false],
  });

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
    this.homeForm.patchValue(
      {
        enabled: home?.enabled ?? true,
        heroHeadline: home?.heroHeadline ?? '',
        heroSubheadline: home?.heroSubheadline ?? '',
        ctaLabel: home?.ctaLabel ?? '',
        ctaUrl: home?.ctaUrl ?? '',
        showRecentPosts: home?.showRecentPosts ?? false,
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
    };
    const prev = this.store.config()?.pages?.home;
    this.store.setHomePage({
      enabled: v.enabled,
      heroHeadline: (v.heroHeadline ?? '').trim(),
      heroSubheadline: v.heroSubheadline?.trim() || undefined,
      ctaLabel: v.ctaLabel?.trim() || undefined,
      ctaUrl: v.ctaUrl?.trim() || undefined,
      showRecentPosts: v.showRecentPosts || undefined,
      seo: prev?.seo,
    });
  }
}
