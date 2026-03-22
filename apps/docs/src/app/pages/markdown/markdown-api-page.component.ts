import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DocsPageHeaderComponent,
  DocsApiTableComponent,
  ApiTableRow,
} from '@foliokit/docs-ui';

const inputRows: ApiTableRow[] = [
  {
    name: 'content',
    type: 'string',
    required: true,
    description: 'Markdown string to render. Uses ngx-markdown to parse and display the content.',
  },
  {
    name: 'embeddedMedia',
    type: 'Record<string, EmbeddedMediaEntry>',
    required: false,
    default: '{}',
    description: 'Map of token keys to EmbeddedMediaEntry objects. Resolves Show Image tokens in the Markdown content to actual image URLs.',
  },
];

const embeddedMediaRows: ApiTableRow[] = [
  { name: 'token',       type: 'string', required: true,  description: 'The unique token key used in the Markdown content.' },
  { name: 'storagePath', type: 'string', required: true,  description: 'Firebase Storage path to the media file.' },
  { name: 'downloadUrl', type: 'string', required: true,  description: 'Public download URL for the media file.' },
  { name: 'alt',         type: 'string', required: true,  description: 'Alt text for the image.' },
  { name: 'mimeType',    type: 'string', required: true,  description: 'MIME type of the media file (e.g. image/jpeg).' },
];

@Component({
  selector: 'docs-markdown-api-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsApiTableComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="inputs">Inputs</h2>
      <docs-api-table [rows]="inputRows" />
    </section>

    <section class="mt-10">
      <h2 id="embedded-media">EmbeddedMediaEntry</h2>
      <p>
        Each entry in the <code>embeddedMedia</code> record maps a token key to the following
        fields:
      </p>
      <docs-api-table [rows]="embeddedMediaRows" />
    </section>
  `,
})
export class MarkdownApiPageComponent {
  protected readonly inputRows = inputRows;
  protected readonly embeddedMediaRows = embeddedMediaRows;
}
