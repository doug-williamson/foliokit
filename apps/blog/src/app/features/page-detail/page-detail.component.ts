import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AboutPageComponent, LinksPageComponent } from '@foliokit/cms-ui';
import type { CmsPageUnion } from '@foliokit/cms-core';

@Component({
  selector: 'blog-page-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AboutPageComponent, LinksPageComponent],
  template: `
    @switch (page.type) {
      @case ('about') {
        <cms-about-page [page]="asAbout(page)" />
      }
      @case ('links') {
        <cms-links-page [page]="asLinks(page)" />
      }
    }
  `,
})
export class PageDetailComponent {
  private readonly route = inject(ActivatedRoute);

  readonly page = this.route.snapshot.data['page'] as CmsPageUnion;

  asAbout(p: CmsPageUnion) {
    return p as import('@foliokit/cms-core').AboutPage;
  }

  asLinks(p: CmsPageUnion) {
    return p as import('@foliokit/cms-core').LinksPage;
  }
}
