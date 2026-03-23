import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DocsPageHeaderComponent, DocsPreviewComponent } from '@foliokit/docs-ui';
import { LinksPageComponent } from '@foliokit/cms-ui';
import type { LinksPage } from '@foliokit/cms-core';

const mockLinksPage: LinksPage = {
  id: 'demo-links',
  type: 'links',
  slug: 'jane-doe',
  title: 'Jane Doe',
  bio: 'Frontend engineer. Building with Angular, Firebase, and Material Design.',
  headline: 'Frontend Engineer',
  status: 'published',
  seo: {},
  updatedAt: Date.now(),
  createdAt: Date.now(),
  links: [
    {
      id: 'link-1',
      label: 'GitHub',
      url: 'https://github.com',
      platform: 'github',
      icon: 'code',
      order: 1,
    },
    {
      id: 'link-2',
      label: 'Twitter / X',
      url: 'https://twitter.com',
      platform: 'twitter',
      icon: 'alternate_email',
      order: 2,
      highlighted: true,
    },
    {
      id: 'link-3',
      label: 'LinkedIn',
      url: 'https://linkedin.com',
      platform: 'linkedin',
      icon: 'work',
      order: 3,
    },
  ],
};

const mockActivatedRoute = {
  data: of({ page: mockLinksPage }),
  snapshot: { data: { page: mockLinksPage } },
};

const previewCode = `<folio-links-page />

// Provide via route resolver:
{
  path: 'links/:slug',
  component: LinksPageComponent,
  resolve: { page: linksPageResolver },
}`;

@Component({
  selector: 'docs-links-page-examples-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DocsPageHeaderComponent, DocsPreviewComponent, LinksPageComponent],
  providers: [{ provide: ActivatedRoute, useValue: mockActivatedRoute }],
  template: `
    <docs-page-header />

    <docs-preview [code]="previewCode">
      <cms-links-page />
    </docs-preview>
  `,
})
export class LinksPageExamplesPageComponent {
  protected readonly previewCode = previewCode;
}
