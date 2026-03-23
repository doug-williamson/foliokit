import type { SeoMeta } from './post.model';

export type { SeoMeta };

export interface NavItem {
  label: string;
  url: string;
  order?: number;
  external?: boolean;
  icon?: string;
}

export type SocialPlatform =
  | 'twitter'
  | 'instagram'
  | 'github'
  | 'linkedin'
  | 'youtube'
  | 'twitch'
  | 'bluesky'
  | 'tiktok'
  | 'facebook'
  | 'email'
  | 'website';

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  label?: string;
  icon?: string;
}

export interface AboutPageConfig {
  headline: string;
  subheadline?: string;
  /** Markdown — rendered via MarkdownComponent */
  bio: string;
  /** Firebase Storage URL */
  photoUrl?: string;
  photoAlt?: string;
  socialLinks?: SocialLink[];
  seo?: SeoMeta;
}

export interface SiteConfig {
  id: string;
  siteName: string;
  siteUrl: string;
  description?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  accentColor?: string;
  nav: NavItem[];
  social: SocialLink[];
  defaultAuthorId?: string;
  defaultSeo?: SeoMeta;
  pages?: {
    about?: AboutPageConfig;
  };
  /** Unix milliseconds. */
  updatedAt: number;
}
