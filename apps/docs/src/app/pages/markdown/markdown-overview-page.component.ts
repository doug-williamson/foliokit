import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DocsPageHeaderComponent,
  DocsCodeBlockComponent,
  DocsCalloutComponent,
} from '@foliokit/docs-ui';

const basicUsage = `import { MarkdownComponent } from '@foliokit/cms-markdown';

@Component({
  imports: [MarkdownComponent],
  template: \`
    <folio-markdown [content]="markdownContent" />
  \`,
})
export class MyPageComponent {
  readonly markdownContent = \`
# Hello World

This is **bold** and this is *italic*.

\\\`\\\`\\\`typescript
const greeting = 'Hello, FolioKit!';
console.log(greeting);
\\\`\\\`\\\`
  \`;
}`;

const embeddedMediaUsage = `// Markdown content with embedded media token
const content = \`
## My Article

Here is an embedded image:

Show Image: hero-image

More text continues here.
\`;

// EmbeddedMediaEntry map
const embeddedMedia: Record<string, EmbeddedMediaEntry> = {
  'hero-image': {
    token: 'hero-image',
    storagePath: 'images/hero.jpg',
    downloadUrl: 'https://storage.googleapis.com/my-bucket/images/hero.jpg',
    alt: 'Hero image description',
    mimeType: 'image/jpeg',
  },
};

// In template:
// <folio-markdown [content]="content" [embeddedMedia]="embeddedMedia" />`;

@Component({
  selector: 'docs-markdown-overview-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsCodeBlockComponent, DocsCalloutComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="overview">Overview</h2>
      <p>
        <code>MarkdownComponent</code> (<code>folio-markdown</code>) renders Markdown strings
        to HTML using <code>ngx-markdown</code> under the hood. It applies Tailwind Typography
        <code>prose</code> classes for consistent styling and supports custom embedded media
        tokens for inline images stored in Firebase Storage.
      </p>
      <docs-callout variant="info">
        <code>ngx-markdown</code> is a peer dependency. Ensure it is installed in your project:
        <code>npm install ngx-markdown marked</code>
      </docs-callout>
    </section>

    <section class="mt-10">
      <h2 id="basic-usage">Basic Usage</h2>
      <docs-code-block [code]="basicUsage" language="typescript" />
    </section>

    <section class="mt-10">
      <h2 id="embedded-media">Embedded Media</h2>
      <p>
        Pass an <code>embeddedMedia</code> record to resolve custom image tokens inside
        your Markdown content. The token syntax is <code>Show Image: token-key</code> on
        its own line.
      </p>
      <docs-code-block [code]="embeddedMediaUsage" language="typescript" />
    </section>
  `,
})
export class MarkdownOverviewPageComponent {
  protected readonly basicUsage = basicUsage;
  protected readonly embeddedMediaUsage = embeddedMediaUsage;
}
