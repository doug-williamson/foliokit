import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  RhombusButtonComponent,
  RhombusConfirmService,
  RhombusIconComponent,
  RhombusOverflowMenuComponent,
  RhombusTabGroupDirective,
  RhombusToastService,
  RhombusTooltipDirective,
  type OverflowMenuItem,
} from '@rhombuskit/core';
import { BlogPost } from '@foliokit/cms-core';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
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
    MatSidenavModule,
    MatTabsModule,
    PostPublishButtonComponent,
    ContentTabComponent,
    MediaTabComponent,
    MetadataTabComponent,
    SeoTabComponent,
    ArticlePreviewComponent,
    CardPreviewComponent,
    SeoPreviewComponent,
    RhombusButtonComponent,
    RhombusIconComponent,
    RhombusOverflowMenuComponent,
    RhombusTabGroupDirective,
    RhombusTooltipDirective,
  ],
  styles: [
    `
      /* Fill the shell's flex-column <main> (rhombus-app-shell__main) so the
       * sidenav split + tab panes get a definite height to flex into. */
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      /*
       * Force sidenav content to participate in flex height layout.
       */
      mat-sidenav {
        width: min(520px, 100vw);
        border-left: var(--border-width) solid var(--border);
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

      /* Tab content area (custom strips replaced by rhombusTabGroup) */
      .tab-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }

      /* rhombusTabGroup panes must fill the sidenav split; each tab's own
         content (markdown editor flexes to fill; metadata/seo self-scroll). */
      mat-tab-group {
        flex: 1;
        min-height: 0;
      }
      ::ng-deep .mat-mdc-tab-body-wrapper {
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }
      ::ng-deep .mat-mdc-tab-body {
        height: 100%;
      }
      ::ng-deep .mat-mdc-tab-body-content {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .toolbar-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .toolbar-icon-btn rhombus-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        --rhombus-icon-size: 24px;
        line-height: 0;
        /* Keep the toolbar glyphs neutral (rhombus-button text/primary would
           otherwise tint them with the accent). */
        color: var(--text-primary);
      }

      .post-editor-toolbar {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 8px 12px;
        background: var(--surface-2);
        border-bottom: var(--border-width) solid var(--border);
        flex-shrink: 0;
      }

      @media (min-width: 1024px) {
        .post-editor-toolbar {
          flex-direction: row;
          align-items: center;
          gap: 12px;
          min-height: 48px;
          padding: 0 20px;
        }
      }

      .post-editor-toolbar-title {
        min-width: 0;
        flex: 1 1 auto;
      }

      .post-editor-toolbar-lead {
        display: flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        flex: 1 1 auto;
      }

      .post-editor-title-input {
        font-weight: 600;
        font-size: 1rem;
        background: transparent;
        border: none;
        outline: none;
        color: inherit;
        width: 100%;
        padding: 4px 0;
      }

      .post-editor-title-input::placeholder {
        color: color-mix(in srgb, currentColor 40%, transparent);
        font-weight: 400;
      }

      .post-editor-toolbar-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-width: 0;
      }

      @media (min-width: 1024px) {
        .post-editor-toolbar-actions {
          flex-wrap: nowrap;
          flex-shrink: 0;
          margin-left: auto;
          justify-content: flex-end;
        }
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden relative">
      <!-- Toolbar -->
      <div class="post-editor-toolbar">
        <div class="post-editor-toolbar-lead">
          <rhombus-button
            iconButton
            appearance="text"
            type="button"
            class="toolbar-icon-btn shrink-0"
            (click)="backToPosts()"
            rhombusTooltip="Back to Posts"
            ariaLabel="Back to Posts"
          >
            <rhombus-icon name="arrow_back" />
          </rhombus-button>
          <input
            class="post-editor-toolbar-title post-editor-title-input"
            type="text"
            [value]="store.post()?.title ?? ''"
            (input)="store.updateField('title', $any($event.target).value)"
            placeholder="Untitled post"
            aria-label="Post title"
          />
        </div>

        <div class="post-editor-toolbar-actions">
          @if (store.post()?.status; as status) {
            <span
              class="badge admin-meta shrink-0"
              [class.badge-pub]="status === 'published'"
              [class.badge-draft]="status === 'draft'"
              [class.badge-sched]="status === 'scheduled'"
              [class.badge-arch]="status === 'archived'"
            >
              {{ editorStatusLabel(status) }}
            </span>
          }

          @if (!isDesktop()) {
            <rhombus-button
              iconButton
              appearance="text"
              type="button"
              class="toolbar-icon-btn shrink-0"
              (click)="togglePreview()"
              [rhombusTooltip]="previewOpen() ? 'Close preview' : 'Open preview'"
              [ariaLabel]="previewOpen() ? 'Close preview' : 'Open preview'"
            >
              <rhombus-icon [name]="previewOpen() ? 'close' : 'preview'" />
            </rhombus-button>
            <rhombus-button
              iconButton
              appearance="text"
              type="button"
              class="toolbar-icon-btn shrink-0"
              (click)="onManualSave()"
              [disabled]="store.isSaving() || !store.isDirty()"
              [rhombusTooltip]="store.isDirty() ? 'Save' : 'No changes to save'"
              rhombusTooltipPosition="below"
              ariaLabel="Save"
            >
              <rhombus-icon name="save" />
            </rhombus-button>
          } @else {
            <rhombus-button
              appearance="outlined"
              type="button"
              (click)="onManualSave()"
              [disabled]="store.isSaving() || !store.isDirty()"
              [rhombusTooltip]="store.isDirty() ? 'Save changes' : 'No changes to save'"
            >
              Save
            </rhombus-button>
          }
          @if (store.post(); as post) {
            @if (post.status === 'published') {
              <rhombus-button
                appearance="outlined"
                type="button"
                class="shrink-0"
                [disabled]="store.isSaving()"
                (click)="confirmUnpublish()"
              >
                Unpublish
              </rhombus-button>
            } @else {
              <span class="shrink-0 min-w-0 post-editor-publish-wrap">
                <admin-post-publish-button
                  [currentStatus]="post.status"
                  [isSaving]="store.isSaving()"
                  (statusChange)="onStatusChange($event)"
                />
              </span>
            }
          }

          <!-- Overflow menu -->
          <rhombus-overflow-menu
            class="shrink-0"
            [items]="moreMenuItems()"
            ariaLabel="More options"
          />
        </div>
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
          <mat-tab-group
            rhombusTabGroup
            class="flex flex-col h-full overflow-hidden"
            [mat-stretch-tabs]="true"
            animationDuration="0"
            [selectedIndex]="rightTabIndex()"
            (selectedIndexChange)="onRightTabChange($event)"
          >
            <mat-tab label="Article">
              <ng-template matTabContent><folio-article-preview /></ng-template>
            </mat-tab>
            <mat-tab label="Card">
              <ng-template matTabContent><folio-card-preview /></ng-template>
            </mat-tab>
            <mat-tab label="SEO">
              <ng-template matTabContent><folio-seo-preview /></ng-template>
            </mat-tab>
          </mat-tab-group>
        </mat-sidenav>

        <!-- Main editor pane -->
        <mat-sidenav-content>
          <mat-tab-group
            rhombusTabGroup
            class="flex flex-col h-full overflow-hidden"
            [mat-stretch-tabs]="true"
            animationDuration="0"
            [selectedIndex]="leftTabIndex()"
            (selectedIndexChange)="onLeftTabChange($event)"
          >
            <mat-tab label="Content">
              <ng-template matTabContent><folio-content-tab /></ng-template>
            </mat-tab>
            <mat-tab label="Metadata">
              <ng-template matTabContent><folio-metadata-tab /></ng-template>
            </mat-tab>
            <mat-tab label="SEO">
              <ng-template matTabContent><folio-seo-tab /></ng-template>
            </mat-tab>
            <mat-tab label="Media">
              <ng-template matTabContent><folio-media-tab /></ng-template>
            </mat-tab>
          </mat-tab-group>
        </mat-sidenav-content>
      </mat-sidenav-container>

    </div>
  `,
})
export class PostEditorPageComponent implements OnInit {
  readonly store = inject(PostEditorStore);
  private readonly confirm = inject(RhombusConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(RhombusToastService);
  private readonly router = inject(Router);

  protected backToPosts(): void {
    this.router.navigate(['/posts']);
  }

  /** Route parameter: existing post ID, or absent to create a new draft. */
  readonly id = input<string | undefined>(undefined);

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

  /** Bridge the tab signals to rhombusTabGroup's index-based selection. */
  readonly leftTabIndex = computed(() => this.leftTabs.indexOf(this.leftTab()));
  readonly rightTabIndex = computed(() => this.rightTabs.indexOf(this.rightTab()));

  protected onLeftTabChange(index: number): void {
    this.leftTab.set(this.leftTabs[index]);
  }
  protected onRightTabChange(index: number): void {
    this.rightTab.set(this.rightTabs[index]);
  }

  /** Toolbar overflow menu, reactive to post slug and saving state. */
  protected readonly moreMenuItems = computed<OverflowMenuItem[]>(() => {
    const slug = this.store.post()?.slug;
    return [
      {
        label: 'View on site',
        icon: 'open_in_new',
        disabled: !slug,
        action: () => {
          if (slug) {
            window.open(`/blog/${slug}`, '_blank', 'noopener');
          }
        },
      },
      {
        label: 'Delete post…',
        icon: 'delete',
        variant: 'danger',
        disabled: this.store.isSaving(),
        dividerBefore: true,
        action: () => this.confirmDeletePost(),
      },
    ];
  });

  onStatusChange(status: BlogPost['status']): void {
    if (status === 'scheduled') {
      this.store.updateField('status', 'scheduled');
      this.leftTab.set('Metadata');
      return;
    }
    this.store.updateField('scheduledPublishAt', undefined);
    this.store.updateField('status', status);
    const successMessage =
      status === 'published'
        ? 'Post published'
        : 'Post unpublished';
    this.subscribePostWrite(this.store.save(), { successMessage });
  }

  protected onManualSave(): void {
    this.subscribePostWrite(this.store.save(), { successMessage: 'Changes saved' });
  }

  /**
   * Subscribes to save/publish/unpublish/delete streams and shows snackbars.
   * Omit `successMessage` when no success toast is desired (e.g. delete navigates away).
   */
  private subscribePostWrite(
    op$: Observable<BlogPost | void>,
    options: { successMessage?: string } = {},
  ): void {
    op$.subscribe({
      next: () => {
        if (options.successMessage) {
          this.toast.success(options.successMessage, { duration: 3000 });
        }
      },
      error: () => {
        this.toast.error('Failed to save — please try again', { action: 'Dismiss' });
      },
    });
  }

  protected editorStatusLabel(status: BlogPost['status']): string {
    if (status === 'published') return 'Published';
    if (status === 'archived') return 'Archived';
    if (status === 'scheduled') return 'Scheduled';
    return 'Draft';
  }

  togglePreview(): void {
    this.previewOpen.update((v) => !v);
  }

  protected confirmUnpublish(): void {
    const title = this.store.post()?.title?.trim() || 'Untitled post';
    this.confirm
      .confirm({
        title: 'Unpublish post?',
        message: `“${title}” will return to draft and will no longer be visible on the live site.`,
        confirmLabel: 'Unpublish',
        cancelLabel: 'Keep published',
        variant: 'danger',
      })
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.subscribePostWrite(this.store.unpublish(), {
          successMessage: 'Post unpublished',
        });
      });
  }

  protected confirmDeletePost(): void {
    const title = this.store.post()?.title?.trim() || 'Untitled post';
    this.confirm
      .confirm({
        title: 'Delete post?',
        message: `Permanently delete “${title}”? This cannot be undone.`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        variant: 'danger',
      })
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.subscribePostWrite(this.store.deletePost(), {});
      });
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
