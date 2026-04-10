import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { BlogPost, PostService } from '@foliokit/cms-core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostEditorStore } from './post-editor.store';
import { PostPublishButtonComponent } from './post-publish-button/post-publish-button.component';
import { ContentTabComponent } from './tabs/content-tab.component';
import { MediaTabComponent } from './tabs/media-tab.component';
import { MetadataTabComponent } from './tabs/metadata-tab.component';
import { SeoTabComponent } from './tabs/seo-tab.component';
import { ArticlePreviewComponent } from './preview/article-preview.component';
import { CardPreviewComponent } from './preview/card-preview.component';
import { SeoPreviewComponent } from './preview/seo-preview.component';

type LeftTab = 'Content' | 'Metadata' | 'SEO' | 'Media';
type RightTab = 'Article' | 'Card' | 'SEO';

/**
 * Full post editor page with Content, Metadata, SEO, and Media tabs
 * plus a responsive side-by-side preview panel.
 *
 * The editor is route-parameter driven: supply `id` for an existing post
 * or omit it to create a new draft.  `PostEditorStore` must be provided
 * at the route level (already wired in `adminRoutes`).
 *
 * @example
 * // Via adminRoutes — nothing extra needed.
 * // Direct usage (e.g. in a custom route):
 * {
 *   path: 'posts/:id/edit',
 *   loadComponent: () => import('@foliokit/cms-admin-ui').then(m => m.PostEditorPageComponent),
 *   providers: [PostEditorStore],
 * }
 */
@Component({
  selector: 'folio-post-editor-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
    PostPublishButtonComponent,
    ContentTabComponent,
    MediaTabComponent,
    MetadataTabComponent,
    SeoTabComponent,
    ArticlePreviewComponent,
    CardPreviewComponent,
    SeoPreviewComponent,
  ],
  styles: [
    `
      /*
       * Force sidenav content to participate in flex height layout.
       */
      mat-sidenav {
        width: min(520px, 100vw);
        border-left: 1px solid var(--border);
      }
      mat-sidenav-container {
        flex: 1;
        overflow: hidden;
      }
      ::ng-deep .mat-sidenav-content {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      ::ng-deep .mat-sidenav {
        --mat-sidenav-container-shape: 0px;
        border-radius: 0;
      }

      /* Tab content area */
      .tab-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }

      /* Autosave pulse dot */
      @keyframes folio-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.25; }
      }

      .save-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .save-dot--saving {
        background: var(--teal-400);
        animation: folio-pulse 0.8s infinite;
      }
      .save-dot--saved {
        background: var(--green-600);
      }

      .save-retry-btn {
        font-family: var(--font-mono);
        font-size: 9px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--red-600);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
      }

      .preview-toggle-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .preview-toggle-btn mat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        line-height: 0;
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
      <!-- Toolbar -->
      <div
        class="flex items-center gap-3 shrink-0"
        style="height: 48px; padding: 0 20px; background: var(--surface-2); border-bottom: 1px solid var(--border);"
      >
        <!-- Post title (left) -->
        <span class="flex-1 truncate page-subheading">
          {{ store.post()?.title || 'Untitled post' }}
        </span>

        <!-- Autosave indicator -->
        @if (!store.isNew()) {
          <div style="min-width: 148px; display: flex; align-items: center; justify-content: flex-end;">
            @if (store.saveStatus() === 'saving') {
              <span class="admin-meta flex items-center gap-1.5" style="color: var(--text-muted);">
                <span class="save-dot save-dot--saving"></span>
                Saving...
              </span>
            } @else if (store.saveStatus() === 'saved') {
              <span class="admin-meta flex items-center gap-1.5" style="color: var(--green-600);">
                <span class="save-dot save-dot--saved"></span>
                {{ store.saveStatusLabel() }}
              </span>
            } @else if (store.saveStatus() === 'error') {
              <button class="save-retry-btn" (click)="retryAutosave()">
                {{ store.saveStatusLabel() }}
              </button>
            }
          </div>
        }

        <!-- Status badge -->
        @if (store.post()?.status; as status) {
          <span
            class="badge admin-meta"
            [class.badge-pub]="status === 'published'"
            [class.badge-sched]="status === 'scheduled'"
            [class.badge-draft]="status === 'draft'"
            [class.badge-arch]="status === 'archived'"
          >
            {{ status === 'published' ? '● PUBLISHED' : status === 'scheduled' ? '● SCHEDULED' : status === 'archived' ? '● ARCHIVED' : '● DRAFT' }}
          </span>
        }

        @if (!isDesktop()) {
          <button
            mat-icon-button
            type="button"
            class="preview-toggle-btn"
            (click)="togglePreview()"
            [matTooltip]="previewOpen() ? 'Close preview' : 'Open preview'"
            [attr.aria-label]="previewOpen() ? 'Close preview' : 'Open preview'"
          >
            <mat-icon [svgIcon]="previewOpen() ? 'close' : 'preview'" />
          </button>
          <button mat-icon-button (click)="store.save()" [disabled]="store.isSaving()" matTooltip="Save">
            <mat-icon svgIcon="save" />
          </button>
        } @else {
          <button mat-stroked-button (click)="store.save()" [disabled]="store.isSaving()">
            Save
          </button>
        }
        @if (store.post(); as post) {
          <cms-post-publish-button
            [currentStatus]="post.status"
            [isSaving]="store.saveStatus() === 'saving'"
            (statusChange)="onStatusChange($event)"
          />
        }
      </div>

      <!-- Editor + Preview sidenav -->
      <mat-sidenav-container>
        <!-- Preview sidenav (right) -->
        <mat-sidenav
          #previewSidenav
          position="end"
          [mode]="isDesktop() ? 'side' : 'over'"
          [opened]="isDesktop() || previewOpen()"
          (closedStart)="previewOpen.set(false)"
        >
          <div class="flex flex-col h-full overflow-hidden">
            <!-- Right tab strip -->
            <div class="tab-strip">
              @for (tab of rightTabs; track tab) {
                <button
                  class="tab-btn"
                  [class.active]="rightTab() === tab"
                  (click)="rightTab.set(tab)"
                >{{ tab }}</button>
              }
            </div>
            <!-- Right tab content -->
            <div class="tab-content">
              @switch (rightTab()) {
                @case ('Article') { <folio-article-preview /> }
                @case ('Card') { <folio-card-preview /> }
                @case ('SEO') { <folio-seo-preview /> }
              }
            </div>
          </div>
        </mat-sidenav>

        <!-- Main editor pane -->
        <mat-sidenav-content>
          <div class="flex flex-col h-full overflow-hidden">
            <!-- Left tab strip -->
            <div class="tab-strip">
              @for (tab of leftTabs; track tab) {
                <button
                  class="tab-btn"
                  [class.active]="leftTab() === tab"
                  (click)="leftTab.set(tab)"
                >{{ tab }}</button>
              }
            </div>
            <!-- Left tab content -->
            <div class="tab-content">
              @switch (leftTab()) {
                @case ('Content') { <folio-content-tab /> }
                @case ('Metadata') { <folio-metadata-tab /> }
                @case ('SEO') { <folio-seo-tab /> }
                @case ('Media') { <folio-media-tab /> }
              }
            </div>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
})
export class PostEditorPageComponent implements OnInit {
  readonly store = inject(PostEditorStore);
  private readonly postService = inject(PostService);

  /** Route parameter: existing post ID, or absent to create a new draft. */
  readonly id = input<string | undefined>(undefined);

  private readonly saveSignal$ = new Subject<void>();

  constructor() {
    // Trigger autosave whenever an editable field changes on an existing post.
    effect(() => {
      const post = this.store.post();
      if (!post?.id || !this.store.isDirty()) return;
      this.saveSignal$.next();
    });

    this.saveSignal$
      .pipe(debounceTime(1500), takeUntilDestroyed())
      .subscribe(() => this.doAutosave());
  }

  private doAutosave(): void {
    const post = this.store.post();
    if (!post?.id) return;
    this.store.setSaveStatus('saving');
    this.postService.savePost(post).subscribe({
      next: () => {
        this.store.setSaveStatus('saved');
        this.store.setLastSavedAt(new Date());
      },
      error: () => this.store.setSaveStatus('error'),
    });
  }

  protected retryAutosave(): void {
    this.doAutosave();
  }

  readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe('(min-width: 1024px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  protected previewOpen = signal(false);

  readonly leftTabs: LeftTab[] = ['Content', 'Metadata', 'SEO', 'Media'];
  readonly rightTabs: RightTab[] = ['Article', 'Card', 'SEO'];

  readonly leftTab = signal<LeftTab>('Content');
  readonly rightTab = signal<RightTab>('Article');

  onStatusChange(status: BlogPost['status']): void {
    if (status !== 'scheduled') {
      this.store.updateField('scheduledPublishAt', undefined);
    }
    this.store.updateField('status', status);
    this.doAutosave();
  }

  togglePreview(): void {
    this.previewOpen.update((v) => !v);
  }

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.store.loadPost(id);
    } else {
      this.store.initNew();
    }
  }
}
