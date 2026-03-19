import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PostEditorCoverImageComponent } from './post-editor-cover-image.component';
import { PostEditorEmbeddedMediaComponent } from './post-editor-embedded-media.component';

@Component({
  selector: 'folio-post-editor-media-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PostEditorCoverImageComponent, PostEditorEmbeddedMediaComponent],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow-y: auto;
      }
    `,
  ],
  template: `
    <div class="flex flex-col gap-6 p-4">
      <folio-post-editor-cover-image />
      <folio-post-editor-embedded-media />
    </div>
  `,
})
export class PostEditorMediaTabComponent {}
