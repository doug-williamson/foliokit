import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
} from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { isBlogPageNavEnabled, type SiteConfig } from '@foliokit/cms-core';
import {
  SeoFieldsComponent,
  type SeoFieldsFormGroup,
} from '../components/seo-fields/seo-fields.component';
import { SiteConfigEditorStore } from '../site-config-editor/site-config-editor.store';
import { wireSiteConfigSaveSnackbarFeedback } from '../site-config-editor/site-config-save-snackbar.util';
import { SaveBarComponent } from '../components/save-bar/save-bar.component';
import { BlogPublishSettingsComponent } from './blog-publish-settings.component';

const PAGE_DESCRIPTION =
  'Configure the Publish section: enable posts and authors in the admin, and open the posts list.';

@Component({
  selector: 'folio-blog-page-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    MatButtonModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    BlogPublishSettingsComponent,
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
        <h1 class="page-heading flex-1">Blog</h1>
      </div>

      @if (!store.config()) {
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <div class="flex-1 overflow-y-auto">
          <div class="flex flex-col gap-6 max-w-2xl mx-auto px-6 py-8">
            <folio-blog-publish-settings layout="page" />

            <div class="flex flex-col gap-2">
              <h2 class="text-sm font-medium m-0">SEO</h2>
              <p class="text-sm opacity-60 m-0">
                Optional meta tags for the blog listing area when your theme supports them.
              </p>
              <folio-seo-fields [group]="blogSeoForm" />
            </div>
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
export class BlogPageEditorComponent implements OnInit {
  readonly store = inject(SiteConfigEditorStore);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly blogSeoForm: SeoFieldsFormGroup = new FormGroup({
    metaTitle: new FormControl<string | null>(null),
    metaDescription: new FormControl<string | null>(null),
    ogImageUrl: new FormControl<string | null>(null),
    canonicalUrl: new FormControl<string | null>(null),
  });

  constructor() {
    wireSiteConfigSaveSnackbarFeedback(this.store, this.snackBar);
    effect(() => {
      const c = this.store.config();
      if (!c) return;
      const site = c.siteName?.trim();
      const suffix = site && site.length > 0 ? site : 'Admin';
      this.title.setTitle(`Publish | ${suffix}`);
    });
  }

  ngOnInit(): void {
    this.store.load();
    this.title.setTitle('Publish');
    this.meta.updateTag({ name: 'description', content: PAGE_DESCRIPTION });
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    const pollInterval = setInterval(() => {
      const config = this.store.config();
      if (!config) return;
      clearInterval(pollInterval);
      this.populateBlogSeoFromConfig(config);
      this.blogSeoForm.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.flushBlogToStore());
    }, 50);
  }

  protected onSave(): void {
    this.flushBlogToStore();
    this.store.save();
  }

  protected onDiscard(): void {
    this.store.discard();
    const config = this.store.config();
    if (config) this.populateBlogSeoFromConfig(config);
  }

  private populateBlogSeoFromConfig(config: SiteConfig): void {
    const seo = config.pages?.blog?.seo;
    this.blogSeoForm.patchValue(
      {
        metaTitle: seo?.title ?? null,
        metaDescription: seo?.description ?? null,
        ogImageUrl: seo?.ogImage ?? null,
        canonicalUrl: seo?.canonicalUrl ?? null,
      },
      { emitEvent: false },
    );
  }

  private flushBlogToStore(): void {
    const current = this.store.config();
    if (!current) return;
    const v = this.blogSeoForm.getRawValue();
    const prevBlog = current.pages?.blog;
    const enabled = prevBlog?.enabled ?? isBlogPageNavEnabled(current);
    this.store.setBlogPage({
      ...prevBlog,
      enabled,
      seo: {
        ...prevBlog?.seo,
        title: v.metaTitle ?? '',
        description: v.metaDescription ?? '',
        ogImage: v.ogImageUrl ?? '',
        canonicalUrl: v.canonicalUrl ?? '',
      },
    });
  }
}
