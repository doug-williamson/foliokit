import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { BlogPost } from '@foliokit/cms-core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../shared/confirm-dialog/confirm-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';

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
    MatSnackBarModule,
    MatTooltipModule,
    PostPublishButtonComponent,
    ContentTabComponent,
    MediaTabComponent,
    MetadataTabComponent,
    SeoTabComponent,
    ArticlePreviewComponent,
    CardPreviewComponent,
    SeoPreviewComponent,
    MatMenuModule,
    MatDivider,
  ],
  styles: [
    `
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

      /* Tab content area */
      .tab-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }

      .toolbar-icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .toolbar-icon-btn mat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        line-height: 0;
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
        <input
          class="post-editor-toolbar-title post-editor-title-input"
          type="text"
          [value]="store.post()?.title ?? ''"
          (input)="store.updateField('title', $any($event.target).value)"
          placeholder="Untitled post"
          aria-label="Post title"
        />

        <div class="post-editor-toolbar-actions">
          @if (store.post()?.status; as status) {
            <span
              class="badge admin-meta shrink-0"
              [class.badge-pub]="status === 'published'"
              [class.badge-draft]="status === 'draft' || status === 'scheduled'"
              [class.badge-arch]="status === 'archived'"
            >
              {{ editorStatusLabel(status) }}
            </span>
          }

          @if (!isDesktop()) {
            <button
              mat-icon-button
              type="button"
              class="toolbar-icon-btn shrink-0"
              (click)="togglePreview()"
              [matTooltip]="previewOpen() ? 'Close preview' : 'Open preview'"
              [attr.aria-label]="previewOpen() ? 'Close preview' : 'Open preview'"
            >
              <mat-icon [svgIcon]="previewOpen() ? 'close' : 'preview'" />
            </button>
            <button
              mat-icon-button
              type="button"
              class="toolbar-icon-btn shrink-0"
              (click)="onManualSave()"
              [disabled]="store.isSaving() || !store.isDirty()"
              [matTooltip]="store.isDirty() ? 'Save' : 'No changes to save'"
              matTooltipPosition="below"
            >
              <mat-icon svgIcon="save" />
            </button>
          } @else {
            <button
              mat-stroked-button
              type="button"
              (click)="onManualSave()"
              [disabled]="store.isSaving() || !store.isDirty()"
              [matTooltip]="store.isDirty() ? 'Save changes' : 'No changes to save'"
            >
              Save
            </button>
          }
          @if (store.post(); as post) {
            @if (post.status === 'published') {
              <button
                mat-stroked-button
                type="button"
                class="shrink-0"
                [disabled]="store.isSaving()"
                (click)="confirmUnpublish()"
              >
                Unpublish
              </button>
            } @else {
              <span class="shrink-0 min-w-0 post-editor-publish-wrap">
                <cms-post-publish-button
                  [currentStatus]="post.status"
                  [isSaving]="store.isSaving()"
                  (statusChange)="onStatusChange($event)"
                />
              </span>
            }
          }

          <!-- Overflow menu -->
          <button
            mat-icon-button
            type="button"
            class="toolbar-icon-btn shrink-0"
            [matMenuTriggerFor]="moreMenu"
            aria-label="More options"
          >
            <mat-icon svgIcon="more_vert" />
          </button>

          <mat-menu #moreMenu>
            <a
              mat-menu-item
              [attr.href]="store.post()?.slug ? '/blog/' + store.post()!.slug : null"
              [disabled]="!store.post()?.slug"
              target="_blank"
              rel="noopener"
            >
              <mat-icon svgIcon="open_in_new" />
              View on site
            </a>
            <mat-divider />
            <button
              mat-menu-item
              [style.color]="'var(--mat-sys-error)'"
              [disabled]="store.isSaving()"
              (click)="confirmDeletePost()"
            >
              <mat-icon svgIcon="delete" />
              Delete post…
            </button>
          </mat-menu>
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
          <div class="flex flex-col h-full overflow-hidden">
            <!-- Right tab strip -->
            <div class="tab-strip tab-strip--equal">
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
            <div class="tab-strip tab-strip--equal">
              @for (tab of leftTabs; track tab) {
                <button
                  type="button"
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
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private static readonly errorSnackbarPanelClass = ['save-error-snackbar'];

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

  onStatusChange(status: BlogPost['status']): void {
    this.store.updateField('scheduledPublishAt', undefined);
    this.store.updateField('status', status);
    const successMessage =
      status === 'published'
        ? 'Post published'
        : status === 'draft'
          ? 'Post unpublished'
          : 'Changes saved';
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
          this.snackBar.open(options.successMessage, undefined, { duration: 3000 });
        }
      },
      error: () => {
        this.snackBar.open('Failed to save — please try again', 'Dismiss', {
          duration: 5000,
          panelClass: PostEditorPageComponent.errorSnackbarPanelClass,
        });
      },
    });
  }

  protected editorStatusLabel(status: BlogPost['status']): string {
    if (status === 'published') return 'PUBLISHED';
    if (status === 'archived') return 'ARCHIVED';
    return 'DRAFT';
  }

  togglePreview(): void {
    this.previewOpen.update((v) => !v);
  }

  protected confirmUnpublish(): void {
    const title = this.store.post()?.title?.trim() || 'Untitled post';
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: 'Unpublish post?',
          message: `“${title}” will return to draft and will no longer be visible on the live site.`,
          confirmLabel: 'Unpublish',
          cancelLabel: 'Keep published',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.subscribePostWrite(this.store.unpublish(), {
            successMessage: 'Post unpublished',
          });
        }
      });
  }

  protected confirmDeletePost(): void {
    const title = this.store.post()?.title?.trim() || 'Untitled post';
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: 'Delete post?',
          message: `Permanently delete “${title}”? This cannot be undone.`,
          confirmLabel: 'Delete',
          cancelLabel: 'Cancel',
          destructive: true,
        },
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.subscribePostWrite(this.store.deletePost(), {});
        }
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
