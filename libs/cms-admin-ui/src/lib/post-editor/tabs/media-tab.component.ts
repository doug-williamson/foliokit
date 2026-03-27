import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PostEditorMediaTabComponent } from '../post-editor-media-tab.component';

@Component({
  selector: 'folio-media-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PostEditorMediaTabComponent],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }
    `,
  ],
  template: `<folio-post-editor-media-tab />`,
})
export class MediaTabComponent {}
