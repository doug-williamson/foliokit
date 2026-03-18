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

@Component({
  selector: 'admin-post-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PostEditorStore],
  imports: [MatButtonModule, MatTabsModule, ContentTabComponent],
  template: `
    <div class="flex flex-col h-full">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white shrink-0">
        <span class="flex-1 text-sm font-medium text-gray-700 truncate">
          {{ store.post()?.title || 'Untitled post' }}
        </span>

        @if (store.isSaving()) {
          <span class="text-xs text-gray-400">Saving…</span>
        } @else if (store.saveError()) {
          <span class="text-xs text-red-500">{{ store.saveError() }}</span>
        } @else if (!store.isDirty() && store.post()) {
          <span class="text-xs text-gray-400">Saved</span>
        }

        <button mat-stroked-button (click)="store.save()" [disabled]="store.isSaving()">
          Save
        </button>
        <button
          mat-flat-button
          color="primary"
          (click)="store.publish()"
          [disabled]="!store.canPublish() || store.isSaving()"
        >
          Publish
        </button>
      </div>

      <!-- Split pane -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Left pane: editing -->
        <div class="w-1/2 flex flex-col overflow-hidden border-r border-gray-200">
          <mat-tab-group class="flex-1 overflow-hidden" animationDuration="0">
            <mat-tab label="Content">
              <div class="h-full overflow-y-auto">
                <folio-content-tab />
              </div>
            </mat-tab>
            <mat-tab label="Media">
              <div class="p-4 text-gray-400">Media</div>
            </mat-tab>
            <mat-tab label="Metadata">
              <div class="p-4 text-gray-400">Metadata</div>
            </mat-tab>
            <mat-tab label="SEO">
              <div class="p-4 text-gray-400">SEO</div>
            </mat-tab>
          </mat-tab-group>
        </div>

        <!-- Right pane: preview -->
        <div class="w-1/2 flex flex-col overflow-hidden">
          <mat-tab-group class="flex-1 overflow-hidden" animationDuration="0">
            <mat-tab label="Article">
              <div class="p-4 text-gray-400">Article</div>
            </mat-tab>
            <mat-tab label="Card">
              <div class="p-4 text-gray-400">Card</div>
            </mat-tab>
            <mat-tab label="SEO">
              <div class="p-4 text-gray-400">SEO</div>
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
