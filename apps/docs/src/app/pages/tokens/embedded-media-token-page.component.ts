import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsCodeBlockComponent } from '@foliokit/docs-ui';

const embeddedMediaInterface = `// From @foliokit/cms-core
export interface EmbeddedMediaEntry {
  token: string;
  storagePath: string;
  downloadUrl: string;
  alt: string;
  mimeType: string;
}`;

const tokenSyntax = `// In your Markdown string, use the token syntax on its own line:
const content = \`
## My Article

Introductory paragraph.

Show Image: hero-banner

More content follows.
\`;`;

const usageCode = `import { MarkdownComponent } from '@foliokit/cms-markdown';
import type { EmbeddedMediaEntry } from '@foliokit/cms-core';

@Component({
  imports: [MarkdownComponent],
  template: \`
    <folio-markdown
      [content]="content"
      [embeddedMedia]="embeddedMedia"
    />
  \`,
})
export class ArticlePageComponent {
  readonly content = \`
# My Post

Show Image: hero-banner

This text appears below the image.
  \`;

  readonly embeddedMedia: Record<string, EmbeddedMediaEntry> = {
    'hero-banner': {
      token: 'hero-banner',
      storagePath: 'posts/my-post/hero.jpg',
      downloadUrl: 'https://storage.googleapis.com/bucket/posts/my-post/hero.jpg',
      alt: 'Hero banner for My Post',
      mimeType: 'image/jpeg',
    },
  };
}`;

@Component({
  selector: 'docs-embedded-media-token-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsCodeBlockComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="interface" class="mat-headline-small">Interface</h2>
      <p class="mat-body-medium">
        <code>EmbeddedMediaEntry</code> (from <code>@foliokit/cms-core</code>) describes a
        single Firebase Storage media file that can be embedded inside Markdown content via
        a token reference.
      </p>
      <docs-code-block [code]="embeddedMediaInterface" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="token-syntax" class="mat-headline-small">Token Syntax</h2>
      <p class="mat-body-medium">
        Inside your Markdown string, place <code>Show Image: token-key</code> on its own line.
        <code>MarkdownComponent</code> resolves the token against the <code>embeddedMedia</code>
        record and renders the image inline.
      </p>
      <docs-code-block [code]="tokenSyntax" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="usage" class="mat-headline-small">Usage</h2>
      <docs-code-block [code]="usageCode" language="typescript" />
    </section>
  `,
})
export class EmbeddedMediaTokenPageComponent {
  protected readonly embeddedMediaInterface = embeddedMediaInterface;
  protected readonly tokenSyntax = tokenSyntax;
  protected readonly usageCode = usageCode;
}
