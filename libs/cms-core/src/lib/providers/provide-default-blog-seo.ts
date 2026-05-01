import { makeEnvironmentProviders } from '@angular/core';
import { BLOG_SEO_SERVICE } from '../tokens/blog-seo-service.token';
import { DefaultBlogSeoService } from '../services/default-blog-seo.service';

export function provideDefaultBlogSeo() {
  return makeEnvironmentProviders([
    DefaultBlogSeoService,
    { provide: BLOG_SEO_SERVICE, useExisting: DefaultBlogSeoService },
  ]);
}
