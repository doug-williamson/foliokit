import type { SeoMeta } from './post.model';
import type { LinksLink } from './page.model';

export type { SeoMeta };

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
  enabled: boolean;
  headline: string;
  subheadline?: string;
  /** Markdown — rendered via MarkdownComponent */
  bio: string;
  /** Firebase Storage URL */
  photoUrl?: string;
  /** Firebase Storage URL — shown in dark mode when set */
  photoUrlDark?: string;
  photoAlt?: string;
  socialLinks?: SocialLink[];
  seo?: SeoMeta;
}

export interface LinksPageConfig {
  enabled: boolean;
  links?: LinksLink[];
  title?: string;
  avatarUrl?: string;
  avatarUrlDark?: string;
  avatarAlt?: string;
  headline?: string;
  bio?: string;
  seo?: SeoMeta;
}

export interface HomePageConfig {
  enabled: boolean;
  heroHeadline: string;
  heroSubheadline?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  showRecentPosts?: boolean;
  seo?: SeoMeta;
}

/** Public blog section and admin Publish nav; gate with `enabled` only in this pass. */
export interface BlogPageConfig {
  enabled: boolean;
  seo?: SeoMeta;
}

export interface SiteConfig {
  id: string;
  siteName: string;
  siteUrl: string;
  description?: string;
  logo?: string;
  favicon?: string;
  defaultAuthorId?: string;
  defaultSeo?: SeoMeta;
  pages?: {
    home?: HomePageConfig;
    blog?: BlogPageConfig;
    about?: AboutPageConfig;
    links?: LinksPageConfig;
  };
  /**
   * Set to `true` once the user has enabled all four pages at least once.
   * After this point the full admin shell is always shown, even if pages are
   * later individually disabled. Prevents toggling a page off post-setup from
   * reverting the UI to the onboarding layout.
   */
  onboardingComplete?: boolean;
  /** Unix milliseconds. */
  updatedAt: number;
}

/** Whether the blog page section is enabled. */
export function isBlogPageNavEnabled(config: SiteConfig | null | undefined): boolean {
  return config?.pages?.blog?.enabled === true;
}
