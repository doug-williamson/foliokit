import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl } from '@angular/forms';
import {
  RhombusAccordionComponent,
  RhombusAccordionPanelComponent,
  RhombusInputComponent,
  RhombusPageHeaderComponent,
  RhombusSpinnerComponent,
  RhombusTextareaComponent,
} from '@rhombuskit/core';
import { LinksEditorFormComponent } from './links-editor-form.component';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';
import { wireSiteConfigSaveSnackbarFeedback } from '../site-config-editor/site-config-save-snackbar.util';
import { SaveBarComponent } from '../components/save-bar/save-bar.component';
import { ProfilePreviewComponent } from '../shared/profile-preview/profile-preview.component';

/**
 * Links page editor — Content (title, headline, bio, link list) tab with
 * inline SEO expansion panel, and `folio-save-bar` for save/discard.
 *
 * `SiteConfigEditorStore` must be provided at the route level (already
 * wired in `adminRoutes`). The component calls `store.load()` on init.
 */
@Component({
  selector: 'folio-links-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RhombusAccordionComponent,
    RhombusAccordionPanelComponent,
    RhombusInputComponent,
    RhombusPageHeaderComponent,
    RhombusTextareaComponent,
    RhombusSpinnerComponent,
    LinksEditorFormComponent,
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
      .links-scroll {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
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
        <div class="links-scroll">
          <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
            <rhombus-page-header title="Links Page" />
            <folio-profile-preview
              [profile]="store.config()?.profile ?? null"
              settingsRoute="/settings"
            />

            <admin-links-editor-form />

            <rhombus-accordion>
              <rhombus-accordion-panel title="SEO overrides">
                <div class="flex flex-col gap-4 pt-2">
                  <rhombus-input
                    label="Meta Title"
                    placeholder="My Links"
                    [control]="linksSeoForm.controls.metaTitle"
                  />
                  <rhombus-textarea
                    label="Meta Description"
                    placeholder="Short description…"
                    [rows]="3"
                    [control]="linksSeoForm.controls.metaDescription"
                  />
                </div>
              </rhombus-accordion-panel>
            </rhombus-accordion>
          </div>
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
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  /** Guards one-time form population once the store's config first resolves. */
  private populated = false;

  protected readonly linksSeoForm = this.fb.group({
    metaTitle: new FormControl<string | null>(null),
    metaDescription: new FormControl<string | null>(null),
  });

  constructor() {
    wireSiteConfigSaveSnackbarFeedback(this.store);

    // Populate the SEO form once, when the store's config first resolves.
    // Replaces a setInterval(50ms) poll; patchValue uses emitEvent:false so
    // it never feeds back into the flush subscription.
    effect(() => {
      if (!this.store.config() || this.populated) return;
      this.populated = true;
      this.patchLinksSeoFromStore();
    });
  }

  ngOnInit(): void {
    this.store.load();

    this.linksSeoForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.flushLinksSeoToStore());
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
    };
    this.store.updateLinks({
      ...current,
      seo: {
        ...current.seo,
        title: v.metaTitle ?? '',
        description: v.metaDescription ?? '',
      },
    });
  }
}
