import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsCodeBlockComponent, DocsPreviewComponent } from '@foliokit/docs-ui';

const seoPreviewCode = `import type { SeoMeta } from '@foliokit/cms-core';

const seo: SeoMeta = {
  title: 'Jane Doe — Links',
  description: 'Find me on GitHub, Twitter, and LinkedIn.',
  ogImage: 'https://example.com/og.jpg',
  canonicalUrl: 'https://example.com/links/jane-doe',
};`;

@Component({
  selector: 'docs-seo-meta-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .og-card {
      border: 1px solid var(--mat-sys-outline-variant, #ccc);
      border-radius: 12px;
      overflow: hidden;
      max-width: 500px;
      font-family: system-ui, sans-serif;
    }
    .og-image {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: 500;
    }
    .og-body {
      padding: 12px 16px;
    }
    .og-url {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant, #666);
      text-transform: uppercase;
    }
    .og-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--mat-sys-on-surface, #111);
      margin: 4px 0;
    }
    .og-desc {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant, #666);
    }
  `],
  template: `
    <p class="mat-body-small mb-2" style="color: var(--mat-sys-on-surface-variant)">
      How this SeoMeta renders as an Open Graph card:
    </p>
    <div class="og-card">
      <div class="og-image">og:image — https://example.com/og.jpg</div>
      <div class="og-body">
        <div class="og-url">example.com</div>
        <div class="og-title">Jane Doe — Links</div>
        <div class="og-desc">Find me on GitHub, Twitter, and LinkedIn.</div>
      </div>
    </div>
  `,
})
class SeoMetaPreviewComponent {}

const seoMetaInterface = `// From @foliokit/cms-core
export interface SeoMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}`;

const usageCode = `import type { LinksPage, SeoMeta } from '@foliokit/cms-core';

// Used inside LinksPage (and other CmsPageBase subtypes):
const myPage: LinksPage = {
  id: 'my-links',
  type: 'links',
  slug: 'jane-doe',
  title: 'Jane Doe',
  status: 'published',
  seo: {
    title: 'Jane Doe — Links',
    description: 'Find me on GitHub, Twitter, and LinkedIn.',
    ogImage: 'https://example.com/og.jpg',
    canonicalUrl: 'https://example.com/links/jane-doe',
  } satisfies SeoMeta,
  links: [],
  updatedAt: Date.now(),
  createdAt: Date.now(),
};`;

@Component({
  selector: 'docs-seo-meta-token-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsCodeBlockComponent, DocsPreviewComponent, SeoMetaPreviewComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="live-preview" class="mat-headline-small">Live Preview</h2>
      <docs-preview [code]="seoPreviewCode">
        <docs-seo-meta-preview />
      </docs-preview>
    </section>

    <section class="mt-8">
      <h2 id="interface" class="mat-headline-small">Interface</h2>
      <p class="mat-body-medium">
        <code>SeoMeta</code> is a flat TypeScript interface from <code>@foliokit/cms-core</code>.
        All fields are optional. It is embedded in every <code>CmsPageBase</code> subtype
        (e.g. <code>LinksPage</code>, <code>AboutPage</code>).
      </p>
      <docs-code-block [code]="seoMetaInterface" language="typescript" />
    </section>

    <section class="mt-8">
      <h2 id="usage" class="mat-headline-small">Usage</h2>
      <p class="mat-body-medium">Embed a <code>SeoMeta</code> object in the <code>seo</code> field of any page:</p>
      <docs-code-block [code]="usageCode" language="typescript" />
    </section>
  `,
})
export class SeoMetaTokenPageComponent {
  protected readonly seoMetaInterface = seoMetaInterface;
  protected readonly usageCode = usageCode;
  protected readonly seoPreviewCode = seoPreviewCode;
}
