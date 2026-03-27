import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsCodeBlockComponent, DocsPreviewComponent } from '@foliokit/docs-ui';
import { MarkdownComponent } from '@foliokit/cms-markdown';
import type { EmbeddedMediaEntry } from '@foliokit/cms-core';

const demoMarkdown = `## My Article

Introductory paragraph about the project.

Show Image: hero-banner

More content follows the embedded image.`;

const demoMedia: Record<string, EmbeddedMediaEntry> = {
  'hero-banner': {
    token: 'hero-banner',
    storagePath: 'posts/demo/hero.svg',
    downloadUrl: 'https://placehold.co/800x400/6366f1/white?text=hero-banner+token',
    alt: 'Hero banner placeholder',
    mimeType: 'image/svg+xml',
  },
};

const embeddedPreviewCode = `import { MarkdownComponent } from '@foliokit/cms-markdown';
import type { EmbeddedMediaEntry } from '@foliokit/cms-core';

const media: Record<string, EmbeddedMediaEntry> = {
  'hero-banner': {
    token: 'hero-banner',
    storagePath: 'posts/demo/hero.jpg',
    downloadUrl: 'https://storage.googleapis.com/...',
    alt: 'Hero banner',
    mimeType: 'image/jpeg',
  },
};

@Component({
  imports: [MarkdownComponent],
  template: \`
    <folio-markdown
      [content]="content"
      [embeddedMedia]="media"
    />
  \`,
})
export class MyComponent { }`;

@Component({
  selector: 'docs-embedded-media-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownComponent],
  template: `<folio-markdown [content]="content" [embeddedMedia]="media" />`,
})
class EmbeddedMediaPreviewComponent {
  readonly content = demoMarkdown;
  readonly media = demoMedia;
}

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
  imports: [DocsPageHeaderComponent, DocsCodeBlockComponent, DocsPreviewComponent, EmbeddedMediaPreviewComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="live-preview" class="mat-headline-small">Live Preview</h2>
      <p class="mat-body-medium mb-4">
        Markdown content with an <code>EmbeddedMediaEntry</code> resolved inline:
      </p>
      <docs-preview [code]="embeddedPreviewCode">
        <docs-embedded-media-preview />
      </docs-preview>
    </section>

    <section class="mt-8">
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
  protected readonly embeddedPreviewCode = embeddedPreviewCode;
}
