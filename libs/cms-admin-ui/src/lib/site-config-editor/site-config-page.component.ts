import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthorService } from '@foliokit/cms-core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsProTabComponent } from '../settings/settings-pro-tab.component';
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
    SettingsProTabComponent,
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

          <mat-tab label="Pro">
            <folio-settings-pro-tab />
          </mat-tab>
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
  }
}
