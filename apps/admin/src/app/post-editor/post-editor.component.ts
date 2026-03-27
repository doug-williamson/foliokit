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
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PostEditorStore } from '@foliokit/cms-admin-ui';
import { ContentTabComponent } from './tabs/content-tab.component';
import { MediaTabComponent } from './tabs/media-tab.component';
import { MetadataTabComponent } from './tabs/metadata-tab.component';
import { SeoTabComponent } from './tabs/seo-tab.component';
import { ArticlePreviewComponent } from './preview/article-preview.component';
import { CardPreviewComponent } from './preview/card-preview.component';
import { SeoPreviewComponent } from './preview/seo-preview.component';

@Component({
  selector: 'admin-post-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatTabsModule,
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
       * Force mat-tab-group to participate in flex height layout.
       * The tab body wrapper must stretch to fill remaining space; the tab
       * body content area provides the scroll context for each tab independently.
       */
      ::ng-deep .mat-mdc-tab-body-wrapper {
        flex: 1;
        overflow: hidden;
      }
      ::ng-deep .mat-mdc-tab-body-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      }
      mat-sidenav {
        width: min(420px, 100vw);
        border-left: 1px solid color-mix(in srgb, currentColor 12%, transparent);
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
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden">
      <!-- Toolbar -->
      <div
        class="flex items-center gap-3 px-4 py-2 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <span class="flex-1 text-sm font-medium truncate opacity-80">
          {{ store.post()?.title || 'Untitled post' }}
        </span>

        @if (store.isSaving()) {
          <span class="text-xs opacity-40">Saving…</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        } @else if (!store.isDirty() && store.post()) {
          <span class="text-xs opacity-40">Saved</span>
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
          <mat-tab-group
            class="flex flex-col h-full overflow-hidden"
            animationDuration="0"
          >
            <mat-tab label="Article">
              <folio-article-preview />
            </mat-tab>
            <mat-tab label="Card">
              <folio-card-preview />
            </mat-tab>
            <mat-tab label="SEO">
              <folio-seo-preview />
            </mat-tab>
          </mat-tab-group>
        </mat-sidenav>

        <!-- Main editor pane -->
        <mat-sidenav-content>
          <mat-tab-group
            class="flex flex-col h-full overflow-hidden"
            animationDuration="0"
          >
            <mat-tab label="Content">
              <folio-content-tab />
            </mat-tab>
            <mat-tab label="Metadata">
              <folio-metadata-tab />
            </mat-tab>
            <mat-tab label="SEO">
              <folio-seo-tab />
            </mat-tab>
            <mat-tab label="Media">
              <folio-media-tab />
            </mat-tab>
          </mat-tab-group>
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
