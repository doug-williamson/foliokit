import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { LinksEditorFormComponent } from './links-editor-form.component';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';
import { wireSiteConfigSaveSnackbarFeedback } from '../site-config-editor/site-config-save-snackbar.util';
import {
  SeoFieldsComponent,
  type SeoFieldsFormGroup,
} from '../components/seo-fields/seo-fields.component';
import { SaveBarComponent } from '../components/save-bar/save-bar.component';

/**
 * Links page editor — Content (title, headline, bio, link list) and SEO tabs,
 * with `folio-save-bar` for save/discard.
 *
 * `SiteConfigEditorStore` must be provided at the route level (already
 * wired in `adminRoutes`). The component calls `store.load()` on init.
 */
@Component({
  selector: 'folio-links-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSnackBarModule,
    LinksEditorFormComponent,
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
      ::ng-deep .links-tabs .mat-mdc-tab-body-wrapper {
        flex: 1;
        overflow: hidden;
      }
      ::ng-deep .links-tabs .mat-mdc-tab-body-content {
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
        <h1 class="page-heading flex-1">Links Page</h1>
      </div>

      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <div class="flex flex-col flex-1 min-h-0 overflow-hidden">
          <mat-tab-group
            class="flex flex-col flex-1 min-h-0 overflow-hidden links-tabs"
            [mat-stretch-tabs]="true"
            color="accent"
            animationDuration="200ms"
          >
            <mat-tab label="Content">
              <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
                <mat-card appearance="outlined" class="!shadow-none"
                          style="border-color: color-mix(in srgb, currentColor 14%, transparent); background: color-mix(in srgb, currentColor 4%, transparent)">
                  <mat-card-content class="flex items-start gap-3 !pb-4 !pt-4">
                    <mat-icon class="shrink-0 opacity-70 mt-0.5" svgIcon="person" />
                    <p class="text-sm opacity-85 m-0 leading-relaxed">
                      Profile photo and author details are managed in the
                      <a routerLink="/authors" class="text-[var(--mat-sys-primary)] underline font-medium">Author profile</a>.
                    </p>
                  </mat-card-content>
                </mat-card>

                <admin-links-editor-form />
              </div>
            </mat-tab>

            <mat-tab label="SEO">
              <div class="max-w-2xl mx-auto px-6 py-8">
                <folio-seo-fields [group]="linksSeoForm" />
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      }

      <folio-save-bar
        [isDirty]="store.isDirty()"
        [isSaving]="store.isSaving()"
        (saved)="onSave()"
        (discarded)="onDiscard()"
      />
    </div>
  `,
})
export class LinksPageEditorComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected readonly linksSeoForm: SeoFieldsFormGroup = this.fb.group({
    metaTitle: new FormControl<string | null>(null),
    metaDescription: new FormControl<string | null>(null),
    ogImageUrl: new FormControl<string | null>(null),
    canonicalUrl: new FormControl<string | null>(null),
  }) as SeoFieldsFormGroup;

  constructor() {
    wireSiteConfigSaveSnackbarFeedback(this.store, this.snackBar);
  }

  ngOnInit(): void {
    this.store.load();

    const pollInterval = setInterval(() => {
      const config = this.store.config();
      if (!config) return;
      clearInterval(pollInterval);
      this.patchLinksSeoFromStore();
      this.linksSeoForm.valueChanges.subscribe(() => this.flushLinksSeoToStore());
    }, 50);
  }

  protected onSave(): void {
    this.flushLinksSeoToStore();
    this.store.save();
  }

  protected onDiscard(): void {
    this.store.discard();
    this.patchLinksSeoFromStore();
  }

  private patchLinksSeoFromStore(): void {
    const seo = this.store.config()?.pages?.links?.seo;
    this.linksSeoForm.patchValue(
      {
        metaTitle: seo?.title ?? null,
        metaDescription: seo?.description ?? null,
        ogImageUrl: seo?.ogImage ?? null,
        canonicalUrl: seo?.canonicalUrl ?? null,
      },
      { emitEvent: false },
    );
  }

  private flushLinksSeoToStore(): void {
    const current = this.store.config()?.pages?.links;
    if (!current) return;
    const v = this.linksSeoForm.getRawValue() as {
      metaTitle: string | null;
      metaDescription: string | null;
      ogImageUrl: string | null;
      canonicalUrl: string | null;
    };
    const prev = current.seo;
    this.store.updateLinks({
      ...current,
      seo: {
        ...prev,
        title: v.metaTitle ?? '',
        description: v.metaDescription ?? '',
        ogImage: v.ogImageUrl ?? '',
        canonicalUrl: v.canonicalUrl ?? '',
      },
    });
  }
}
