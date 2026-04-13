import type { SeoMeta } from './post.model';
import type { LinksLink } from './page.model';

export type { SeoMeta };

export interface NavItem {
  label: string;
  url: string;
  order?: number;
  external?: boolean;
  icon?: string;
  /** When true, the item is hidden from the public blog nav. */
  hidden?: boolean;
  /** Optional plan tier required to access this nav item. Used for badge display only. */
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

/** Public blog section and admin Publish nav; gate with `enabled` only in this pass. */
export interface BlogPageConfig {
  enabled: boolean;
  seo?: SeoMeta;
}

/** Toggles extra items under the admin Configuration nav (sidebar shortcuts). */
export interface AdminNavShortcuts {
  /** Show a “Home” link to the home page editor. */
  home?: boolean;
  /** Show a “Publish” shortcut under Pages (opens `/pages/blog`). */
  blog?: boolean;
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
    blog?: BlogPageConfig;
    about?: AboutPageConfig;
    links?: LinksPageConfig;
  };
  adminNavShortcuts?: AdminNavShortcuts;
  /** Unix milliseconds. */
  updatedAt: number;
}

/**
 * Whether the blog page is considered on for admin nav (and legacy shortcut support).
 * Prefer `pages.blog.enabled`; when absent, `adminNavShortcuts.blog === true` still enables until migrated.
 */
export function isBlogPageNavEnabled(config: SiteConfig | null | undefined): boolean {
  if (!config) return false;
  if (config.pages?.blog?.enabled === true) return true;
  return config.adminNavShortcuts?.blog === true;
}
