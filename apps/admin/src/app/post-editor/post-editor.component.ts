import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
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
  providers: [PostEditorStore],
  imports: [
    MatButtonModule,
    MatTabsModule,
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

        <button mat-stroked-button (click)="store.save()" [disabled]="store.isSaving()">
          Save
        </button>
        <button
          mat-flat-button
          (click)="store.publish()"
          [disabled]="!store.canPublish() || store.isSaving()"
        >
          Publish
        </button>
      </div>

      <!-- Split pane -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Left pane: editing -->
        <div
          class="w-1/2 flex flex-col overflow-hidden border-r"
          style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
        >
          <mat-tab-group
            class="flex flex-col flex-1 overflow-hidden"
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
        </div>

        <!-- Right pane: preview -->
        <div class="w-1/2 flex flex-col overflow-hidden">
          <mat-tab-group
            class="flex flex-col flex-1 overflow-hidden"
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
        </div>
      </div>
    </div>
  `,
})
export class PostEditorComponent implements OnInit {
  readonly store = inject(PostEditorStore);
  readonly id = input<string | undefined>(undefined);

  ngOnInit(): void {
    const id = this.id();
    if (id) {
      this.store.loadPost(id);
    } else {
      this.store.initNew();
    }
  }
}
