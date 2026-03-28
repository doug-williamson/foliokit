import { InjectionToken } from '@angular/core';
import type { BlogPost } from '../models/post.model';
import type { AboutPageConfig, SiteConfig } from '../models/site-config.model';

/**
 * Contract for a service that manages `<meta>`, `<title>`, canonical links,
 * and JSON-LD structured data for public-facing blog pages.
 *
 * Library components such as `BlogHomeComponent`, `BlogPostListComponent`,
 * and `BlogPostDetailComponent` inject this token **optionally** — if no
 * implementation is provided, SEO tags are simply not set.
 *
 * Consumers wire it up in their `ApplicationConfig`:
 *
 * ```ts
 * { provide: BLOG_SEO_SERVICE, useExisting: MyBlogSeoService }
 * ```
 */
export interface IBlogSeoService {
  setDefaultMeta(config: SiteConfig, canonicalUrl?: string): void;
  setPostMeta(post: BlogPost, baseUrl: string, authorDisplayName?: string): void;
  setAboutMeta(config: AboutPageConfig, baseUrl: string): void;
}

export const BLOG_SEO_SERVICE = new InjectionToken<IBlogSeoService>(
  'BLOG_SEO_SERVICE',
);
