import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostEditorStore } from '@foliokit/cms-admin-ui';
import { ContentTabComponent } from './tabs/content-tab.component';
import { MediaTabComponent } from './tabs/media-tab.component';
import { MetadataTabComponent } from './tabs/metadata-tab.component';
import { SeoTabComponent } from './tabs/seo-tab.component';
import { ArticlePreviewComponent } from './preview/article-preview.component';
import { CardPreviewComponent } from './preview/card-preview.component';
import { SeoPreviewComponent } from './preview/seo-preview.component';

type LeftTab = 'Content' | 'Metadata' | 'SEO' | 'Media';
type RightTab = 'Article' | 'Card' | 'SEO';

@Component({
  selector: 'admin-post-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTooltipModule,
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

      /* Tab strip */
      .tab-strip {
        display: flex;
        border-bottom: 1px solid var(--border);
        background: var(--surface-2);
        gap: 1px;
        flex-shrink: 0;
      }

      .tab-btn {
        font-family: var(--font-display);
        font-size: 13px;
        letter-spacing: 0.02em;
        color: var(--text-muted);
        padding: 12px 16px;
        border-radius: var(--r-sm) var(--r-sm) 0 0;
        cursor: pointer;
        border: none;
        background: none;
        transition: background 0.12s, color 0.12s;
        flex: 1;
        text-align: center;

        &:hover {
          background: var(--surface-3);
          color: var(--text-primary);
        }

        &.active {
          background: var(--surface-0);
          color: var(--text-accent);
          font-weight: 500;
          border-bottom: 2px solid var(--text-accent);
        }
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
        <span
          class="flex-1 truncate"
          style="font-family: var(--font-display); font-size: 16px; color: var(--text-primary);"
        >
          {{ store.post()?.title || 'Untitled post' }}
        </span>

        <!-- Autosave indicator -->
        @if (store.isSaving()) {
          <span class="flex items-center gap-1.5" style="font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted);">
            <span class="save-dot save-dot--saving"></span>
            Saving…
          </span>
        } @else if (store.saveError()) {
          <span style="font-size: 11px; color: var(--red-600);">{{ store.saveError() }}</span>
        } @else if (!store.isDirty() && store.post()) {
          <span class="flex items-center gap-1.5" style="font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted);">
            <span class="save-dot save-dot--saved"></span>
            Saved
          </span>
        }

        <!-- Status badge -->
        @if (store.post()?.status) {
          <span [class]="'badge ' + statusBadgeClass()">{{ statusBadgeLabel() }}</span>
        }

        @if (!isDesktop()) {
          <button mat-icon-button (click)="togglePreview()" matTooltip="Toggle preview">
            <mat-icon>preview</mat-icon>
          </button>
          <button mat-icon-button (click)="store.save()" [disabled]="store.isSaving()" matTooltip="Save">
            <mat-icon>save</mat-icon>
          </button>
          <button
            mat-icon-button
            (click)="onPrimaryAction()"
            [disabled]="!canPrimaryAction() || store.isSaving()"
            [matTooltip]="primaryLabel()"
          >
            <mat-icon>{{ store.post()?.status === 'scheduled' ? 'schedule' : 'publish' }}</mat-icon>
          </button>
        } @else {
          <button mat-stroked-button (click)="store.save()" [disabled]="store.isSaving()">
            Save
          </button>
          <button
            mat-flat-button
            (click)="onPrimaryAction()"
            [disabled]="!canPrimaryAction() || store.isSaving()"
          >
            {{ primaryLabel() }}
          </button>
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
            <div class="tab-strip" role="tablist" aria-label="Post preview tabs">
              @for (tab of rightTabs; track tab; let i = $index) {
                <button
                  class="tab-btn"
                  role="tab"
                  [id]="'preview-tab-' + tab"
                  [attr.aria-selected]="rightTab() === tab"
                  [attr.aria-controls]="'preview-panel-' + tab"
                  [class.active]="rightTab() === tab"
                  (click)="rightTab.set(tab)"
                  (keydown)="onRightTabKeydown($event, i)"
                >{{ tab }}</button>
              }
            </div>
            <!-- Right tab content -->
            <div
              class="tab-content"
              role="tabpanel"
              [id]="'preview-panel-' + rightTab()"
              [attr.aria-labelledby]="'preview-tab-' + rightTab()"
            >
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
            <div class="tab-strip" role="tablist" aria-label="Post editor tabs">
              @for (tab of leftTabs; track tab; let i = $index) {
                <button
                  class="tab-btn"
                  role="tab"
                  [id]="'editor-tab-' + tab"
                  [attr.aria-selected]="leftTab() === tab"
                  [attr.aria-controls]="'editor-panel-' + tab"
                  [class.active]="leftTab() === tab"
                  (click)="leftTab.set(tab)"
                  (keydown)="onLeftTabKeydown($event, i)"
                >{{ tab }}</button>
              }
            </div>
            <!-- Left tab content -->
            <div
              class="tab-content"
              role="tabpanel"
              [id]="'editor-panel-' + leftTab()"
              [attr.aria-labelledby]="'editor-tab-' + leftTab()"
            >
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
export class PostEditorComponent implements OnInit {
  readonly store = inject(PostEditorStore);
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

  protected onLeftTabKeydown(event: KeyboardEvent, currentIndex: number): void {
    const tabs = this.leftTabs;
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') { nextIndex = (currentIndex + 1) % tabs.length; event.preventDefault(); }
    else if (event.key === 'ArrowLeft') { nextIndex = (currentIndex - 1 + tabs.length) % tabs.length; event.preventDefault(); }
    else if (event.key === 'Home') { nextIndex = 0; event.preventDefault(); }
    else if (event.key === 'End') { nextIndex = tabs.length - 1; event.preventDefault(); }
    if (nextIndex !== currentIndex) {
      this.leftTab.set(tabs[nextIndex]);
      document.getElementById('editor-tab-' + tabs[nextIndex])?.focus();
    }
  }

  protected onRightTabKeydown(event: KeyboardEvent, currentIndex: number): void {
    const tabs = this.rightTabs;
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') { nextIndex = (currentIndex + 1) % tabs.length; event.preventDefault(); }
    else if (event.key === 'ArrowLeft') { nextIndex = (currentIndex - 1 + tabs.length) % tabs.length; event.preventDefault(); }
    else if (event.key === 'Home') { nextIndex = 0; event.preventDefault(); }
    else if (event.key === 'End') { nextIndex = tabs.length - 1; event.preventDefault(); }
    if (nextIndex !== currentIndex) {
      this.rightTab.set(tabs[nextIndex]);
      document.getElementById('preview-tab-' + tabs[nextIndex])?.focus();
    }
  }

  readonly primaryLabel = computed(() => {
    const status = this.store.post()?.status;
    if (status === 'scheduled') return 'Schedule';
    if (status === 'published') return 'Publish';
    return 'Save Draft';
  });

  readonly canPrimaryAction = computed(() => {
    const post = this.store.post();
    if (!post) return false;
    if (post.status === 'scheduled') {
      return !!post.scheduledPublishAt && post.scheduledPublishAt > Date.now();
    }
    return true;
  });

  readonly statusBadgeClass = computed(() => {
    const status = this.store.post()?.status;
    if (status === 'published') return 'badge-pub';
    if (status === 'scheduled') return 'badge-sched';
    return 'badge-draft';
  });

  readonly statusBadgeLabel = computed(() => {
    const status = this.store.post()?.status;
    if (status === 'published') return '● PUBLISHED';
    if (status === 'scheduled') return '● SCHEDULED';
    return '● DRAFT';
  });

  togglePreview(): void {
    this.previewOpen.update((v) => !v);
  }

  onPrimaryAction(): void {
    const post = this.store.post();
    if (!post) return;
    if (post.status === 'published') {
      this.store.publish();
    } else {
      this.store.save();
    }
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
