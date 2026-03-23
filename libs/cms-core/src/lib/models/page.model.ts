import type { SeoMeta } from './post.model';
import type { SocialPlatform } from './site-config.model';

export interface CmsPageBase {
  id: string;
  type: 'links';
  slug: string;
  title: string;
  status: 'draft' | 'published';
  seo: SeoMeta;
  /** Unix milliseconds — same convention as BlogPost. */
  updatedAt: number;
  /** Unix milliseconds. */
  createdAt: number;
}

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
}

export type CmsPageUnion = LinksPage;
