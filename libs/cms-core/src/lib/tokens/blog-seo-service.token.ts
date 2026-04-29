import { InjectionToken } from '@angular/core';
import type { BlogPost } from '../models/post.model';
import type {
  AboutPageConfig,
  LinksPageConfig,
  SiteConfig,
} from '../models/site-config.model';

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
  /** Home page (`/`) — reads `config.pages.home.seo.title`. */
  setHomeMeta(config: SiteConfig, baseUrl: string): void;
  /** Posts list (`/posts`) — reads `config.pages.blog.seo.title`. Appends `#tag` when filtered. */
  setBlogMeta(config: SiteConfig, baseUrl: string, tag?: string | null): void;
  /** About page (`/about`) — reads `config.seo.title`. */
  setAboutMeta(config: AboutPageConfig, baseUrl: string): void;
  /** Links page (`/links`) — reads `config.seo.title`. */
  setLinksMeta(config: LinksPageConfig, baseUrl: string): void;
  /** Post detail — reads `post.seo.title`. */
  setPostMeta(post: BlogPost, baseUrl: string, authorDisplayName?: string): void;
  /** Generic site-level fallback (used by series pages, etc.). */
  setDefaultMeta(config: SiteConfig, canonicalUrl?: string): void;
}

export const BLOG_SEO_SERVICE = new InjectionToken<IBlogSeoService>(
  'BLOG_SEO_SERVICE',
);
