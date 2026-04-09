import type { SeoMeta } from './post.model';
import type { LinksLink } from './page.model';

export type { SeoMeta };

export interface NavItem {
  label: string;
  url: string;
  order?: number;
  external?: boolean;
  icon?: string;
  /** Optional plan tier required to access this nav item. Used for badge display only — does not hide or disable the link. */
  requiredPlan?: 'pro' | 'agency';
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'group' in entry && 'items' in entry;
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

export interface SiteConfig {
  id: string;
  siteName: string;
  siteUrl: string;
  description?: string;
  logo?: string;
  favicon?: string;
  nav: NavItem[];
  defaultAuthorId?: string;
  defaultSeo?: SeoMeta;
  pages?: {
    home?: HomePageConfig;
    about?: AboutPageConfig;
    links?: LinksPageConfig;
  };
  /** Set to true once the admin has completed the setup wizard. Never reset. */
  setupComplete?: boolean;
  /** Step IDs the admin has explicitly saved in the setup wizard (tracks optional step acknowledgment). */
  setupAcknowledgedSteps?: string[];
  /** Unix milliseconds. */
  updatedAt: number;
}
