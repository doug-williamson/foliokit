import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DocsPageHeaderComponent,
  DocsApiTableComponent,
  DocsCodeBlockComponent,
  ApiTableRow,
} from '@foliokit/docs-ui';

const routeDataRow: ApiTableRow[] = [
  {
    name: 'data[\'page\']',
    type: 'LinksPage',
    required: true,
    description: 'Page config resolved from the router and injected via ActivatedRoute.data.',
  },
];

const linksLinkRows: ApiTableRow[] = [
  { name: 'id',          type: 'string',         required: true,  description: 'Unique identifier for the link.' },
  { name: 'label',       type: 'string',         required: true,  description: 'Display text shown on the button.' },
  { name: 'url',         type: 'string',         required: true,  description: 'Destination URL.' },
  { name: 'icon',        type: 'string',         required: false, description: 'Material icon name for the button.' },
  { name: 'platform',    type: 'SocialPlatform', required: false, description: 'Platform enum value for styled icon rendering.' },
  { name: 'highlighted', type: 'boolean',        required: false, description: 'When true, renders the link with primary accent styling.' },
  { name: 'order',       type: 'number',         required: true,  description: 'Sort order for rendering links in the list.' },
];

const platformsCode = `// SocialPlatform union (from @foliokit/cms-core)
export type SocialPlatform =
  | 'github'
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'website'
  | 'email';`;

@Component({
  selector: 'docs-links-page-api-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsApiTableComponent, DocsCodeBlockComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="inputs" class="mat-headline-small">Route Data</h2>
      <p class="mat-body-medium">
        <code>LinksPageComponent</code> does not use <code>&#64;Input()</code> or signal inputs.
        It reads its configuration exclusively from <code>ActivatedRoute.data['page']</code>.
      </p>
      <docs-api-table [rows]="routeDataRow" />
    </section>

    <section class="mt-8">
      <h2 id="social-link" class="mat-headline-small">LinksLink Fields</h2>
      <docs-api-table [rows]="linksLinkRows" />
    </section>

    <section class="mt-8">
      <h2 id="platforms" class="mat-headline-small">SocialPlatform Type</h2>
      <docs-code-block [code]="platformsCode" language="typescript" />
    </section>
  `,
})
export class LinksPageApiPageComponent {
  protected readonly routeDataRow = routeDataRow;
  protected readonly linksLinkRows = linksLinkRows;
  protected readonly platformsCode = platformsCode;
}
