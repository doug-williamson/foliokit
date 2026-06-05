import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { RhombusSpinnerComponent } from '@rhombuskit/core';
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
    ReactiveFormsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
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
      <div
        class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <h1 class="page-heading flex-1">Links Page</h1>
      </div>

      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <rhombus-spinner [diameter]="40" />
        </div>
      } @else {
        <div class="links-scroll">
          <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
            <folio-profile-preview
              [profile]="store.config()?.profile ?? null"
              settingsRoute="/settings"
            />

            <admin-links-editor-form />

            <mat-expansion-panel class="!shadow-none">
              <mat-expansion-panel-header>
                <mat-panel-title class="text-sm font-medium">SEO overrides</mat-panel-title>
              </mat-expansion-panel-header>
              <div class="flex flex-col gap-4 pt-2" [formGroup]="linksSeoForm">
                <mat-form-field appearance="outline">
                  <mat-label>Meta Title</mat-label>
                  <input matInput formControlName="metaTitle" placeholder="My Links" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Meta Description</mat-label>
                  <textarea matInput rows="3"
                    formControlName="metaDescription"
                    placeholder="Short description…"></textarea>
                </mat-form-field>
              </div>
            </mat-expansion-panel>
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

  protected readonly linksSeoForm = this.fb.group({
    metaTitle: new FormControl<string | null>(null),
    metaDescription: new FormControl<string | null>(null),
  });

  constructor() {
    wireSiteConfigSaveSnackbarFeedback(this.store);
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
