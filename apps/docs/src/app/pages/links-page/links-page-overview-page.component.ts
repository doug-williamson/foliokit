import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  DocsPageHeaderComponent,
  DocsCodeBlockComponent,
} from '@foliokit/docs-ui';

const basicUsage = `import { LinksPageComponent } from '@foliokit/cms-ui';

// LinksPageComponent reads its data from ActivatedRoute.data['page'].
// Provide a LinksPage object via a route resolver:

const routes: Route[] = [
  {
    path: 'links/:slug',
    component: LinksPageComponent,
    resolve: {
      page: linksPageResolver,
    },
  },
];`;

const socialLinkInterface = `// From @foliokit/cms-core
export interface LinksLink {
  id: string;
  label: string;
  url: string;
  icon?: string;
  platform?: SocialPlatform;
  highlighted?: boolean;
  order: number;
}

export interface LinksPage extends CmsPageBase {
  type: 'links';
  avatarUrl?: string;
  avatarAlt?: string;
  headline?: string;
  bio?: string;
  links: LinksLink[];
}`;

@Component({
  selector: 'docs-links-page-overview-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsCodeBlockComponent],
  template: `
    <docs-page-header />

    <section>
      <h2 id="overview">Overview</h2>
      <p>
        <code>LinksPageComponent</code> (<code>folio-links-page</code>) renders a
        link-in-bio page driven entirely by a <code>LinksPage</code> data object.
        It displays an avatar, headline, bio, and a vertical stack of styled link buttons
        with optional platform-specific icons and highlighted state.
      </p>
    </section>

    <section class="mt-10">
      <h2 id="basic-usage">Basic Usage</h2>
      <p>
        The component reads its page data from <code>ActivatedRoute.data['page']</code>.
        Provide it via a route resolver:
      </p>
      <docs-code-block [code]="basicUsage" language="typescript" />
    </section>

    <section class="mt-10">
      <h2 id="social-link">LinksLink Interface</h2>
      <docs-code-block [code]="socialLinkInterface" language="typescript" />
    </section>
  `,
})
export class LinksPageOverviewPageComponent {
  protected readonly basicUsage = basicUsage;
  protected readonly socialLinkInterface = socialLinkInterface;
}
