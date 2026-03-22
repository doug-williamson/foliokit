import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DocsPageHeaderComponent, DocsCodeBlockComponent } from '@foliokit/docs-ui';

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
  imports: [DocsPageHeaderComponent, DocsCodeBlockComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="interface">Interface</h2>
      <p>
        <code>SeoMeta</code> is a flat TypeScript interface from <code>@foliokit/cms-core</code>.
        All fields are optional. It is embedded in every <code>CmsPageBase</code> subtype
        (e.g. <code>LinksPage</code>, <code>AboutPage</code>).
      </p>
      <docs-code-block [code]="seoMetaInterface" language="typescript" />
    </section>

    <section class="mt-10">
      <h2 id="usage">Usage</h2>
      <p>Embed a <code>SeoMeta</code> object in the <code>seo</code> field of any page:</p>
      <docs-code-block [code]="usageCode" language="typescript" />
    </section>
  `,
})
export class SeoMetaTokenPageComponent {
  protected readonly seoMetaInterface = seoMetaInterface;
  protected readonly usageCode = usageCode;
}
