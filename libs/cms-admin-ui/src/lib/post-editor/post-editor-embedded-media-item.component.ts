import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmbeddedMediaEntry } from '@foliokit/cms-core';
import { PostEditorStore } from './post-editor.store';

@Component({
  selector: 'folio-post-editor-embedded-media-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  styles: [
    `
      :host {
        display: block;
      }
      .item-wrapper:hover .hover-overlay {
        opacity: 1;
      }
      .hover-overlay {
        opacity: 0;
        transition: opacity 0.15s;
      }
    `,
  ],
  template: `
    <div class="item-wrapper flex flex-col gap-1">
      <div class="relative aspect-square rounded-md overflow-hidden bg-[var(--mat-sys-surface-container-high)]">
        <img
          [src]="entry().downloadUrl"
          [alt]="entry().alt"
          class="w-full h-full object-cover"
        />
        <!-- Hover overlay -->
        <div
          class="hover-overlay absolute inset-0 flex items-center justify-center gap-2"
          style="background: rgba(0,0,0,0.5)"
        >
          <button
            mat-icon-button
            style="color: white"
            matTooltip="Insert at cursor"
            (click)="onInsert()"
          >
            <mat-icon svgIcon="add_photo_alternate" />
          </button>
          <button
            mat-icon-button
            style="color: white"
            matTooltip="Delete"
            (click)="onDelete()"
          >
            <mat-icon svgIcon="delete" />
          </button>
        </div>
      </div>
      <span class="text-xs opacity-60 truncate" [title]="entry().alt">
        {{ entry().alt }}
      </span>
    </div>
  `,
})
export class PostEditorEmbeddedMediaItemComponent {
  readonly entry = input.required<EmbeddedMediaEntry>();
  readonly token = input.required<string>();

  readonly store = inject(PostEditorStore);

  onInsert(): void {
    this.store.insertMediaAtCursor(this.token());
  }

  onDelete(): void {
    if (!window.confirm('Remove this image? It will be removed from Storage and any markdown references will break.')) return;
    this.store.removeEmbeddedMedia(this.token());
  }
}
