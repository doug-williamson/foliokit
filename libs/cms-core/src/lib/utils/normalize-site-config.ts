import type {
  AdminNavShortcuts,
  SiteConfig,
  NavItem,
  SocialLink,
  SocialPlatform,
  SeoMeta,
  AboutPageConfig,
  LinksPageConfig,
  HomePageConfig,
} from '../models/site-config.model';
import type { LinksLink } from '../models/page.model';

function normalizeTimestamp(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof (v as { toMillis?: unknown }).toMillis === 'function') {
      return (v as { toMillis(): number }).toMillis();
    }
    if (typeof (v as { toDate?: unknown }).toDate === 'function') {
      return (v as { toDate(): Date }).toDate().getTime();
    }
    if (typeof v['_seconds'] === 'number') {
      return (v['_seconds'] as number) * 1000 +
        Math.floor(((v['_nanoseconds'] as number) ?? 0) / 1e6);
    }
    if (typeof v['seconds'] === 'number') {
      return (v['seconds'] as number) * 1000 +
        Math.floor(((v['nanoseconds'] as number) ?? 0) / 1e6);
    }
  }
  return 0;
}

function normalizeNavItems(raw: unknown): NavItem[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((item) => ({
    label: (item['label'] as string) ?? '',
    url: (item['url'] as string) ?? '',
    order: item['order'] as number | undefined,
    external: item['external'] as boolean | undefined,
    icon: item['icon'] as string | undefined,
  }));
}

function normalizeSocialLinks(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((item) => ({
    platform: item['platform'] as SocialPlatform,
    url: (item['url'] as string) ?? '',
    label: item['label'] as string | undefined,
    icon: item['icon'] as string | undefined,
  }));
}

function normalizeSeoMeta(raw: unknown): SeoMeta | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  return {
    title: r['title'] as string | undefined,
    description: r['description'] as string | undefined,
    keywords: Array.isArray(r['keywords']) ? (r['keywords'] as string[]) : undefined,
    ogImage: r['ogImage'] as string | undefined,
    canonicalUrl: r['canonicalUrl'] as string | undefined,
    noIndex: r['noIndex'] as boolean | undefined,
  };
}

function normalizeLinksLinks(raw: unknown): LinksLink[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((item) => ({
    id: (item['id'] as string) ?? '',
    label: (item['label'] as string) ?? '',
    url: (item['url'] as string) ?? '',
    icon: item['icon'] as string | undefined,
    platform: item['platform'] as LinksLink['platform'] | undefined,
    highlighted: item['highlighted'] as boolean | undefined,
    order: (item['order'] as number) ?? 0,
  }));
}

function normalizeAdminNavShortcuts(raw: unknown): AdminNavShortcuts | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const out: AdminNavShortcuts = {};
  if (typeof r['home'] === 'boolean') out.home = r['home'];
  if (typeof r['blog'] === 'boolean') out.blog = r['blog'];
  return Object.keys(out).length ? out : undefined;
}

function normalizeHomePageConfig(raw: unknown): HomePageConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  return {
    enabled: (r['enabled'] as boolean) ?? false,
    heroHeadline: (r['heroHeadline'] as string) ?? '',
    heroSubheadline: r['heroSubheadline'] as string | undefined,
    ctaLabel: r['ctaLabel'] as string | undefined,
    ctaUrl: r['ctaUrl'] as string | undefined,
    showRecentPosts: r['showRecentPosts'] as boolean | undefined,
    seo: normalizeSeoMeta(r['seo']),
  };
}

function normalizeAboutPageConfig(raw: unknown): AboutPageConfig {
  const r = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  return {
    enabled: (r['enabled'] as boolean) ?? false,
    headline: (r['headline'] as string) ?? '',
    subheadline: r['subheadline'] as string | undefined,
    bio: (r['bio'] as string) ?? '',
    photoUrl: r['photoUrl'] as string | undefined,
    photoUrlDark: r['photoUrlDark'] as string | undefined,
    photoAlt: r['photoAlt'] as string | undefined,
    socialLinks: Array.isArray(r['socialLinks'])
      ? normalizeSocialLinks(r['socialLinks'])
      : undefined,
    seo: normalizeSeoMeta(r['seo']),
  };
}

function normalizeLinksPageConfig(raw: unknown): LinksPageConfig {
  const r = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
  return {
    enabled: (r['enabled'] as boolean) ?? false,
    links: normalizeLinksLinks(r['links']),
    title: r['title'] as string | undefined,
    avatarUrl: r['avatarUrl'] as string | undefined,
    avatarUrlDark: r['avatarUrlDark'] as string | undefined,
    avatarAlt: r['avatarAlt'] as string | undefined,
    headline: r['headline'] as string | undefined,
    bio: r['bio'] as string | undefined,
    seo: normalizeSeoMeta(r['seo']),
  };
}

export function normalizeSiteConfig(raw: Record<string, unknown>): SiteConfig {
  const pages = raw['pages'] as Record<string, unknown> | undefined;

  return {
    id: (raw['id'] as string) ?? '',
    siteName: (raw['siteName'] as string) ?? '',
    siteUrl: (raw['siteUrl'] as string) ?? '',
    description: raw['description'] as string | undefined,
    logo: raw['logo'] as string | undefined,
    favicon: raw['favicon'] as string | undefined,
    nav: normalizeNavItems(raw['nav']),
    defaultAuthorId: raw['defaultAuthorId'] as string | undefined,
    defaultSeo: normalizeSeoMeta(raw['defaultSeo']),
    pages: {
      home: normalizeHomePageConfig(pages?.['home']),
      about: normalizeAboutPageConfig(pages?.['about']),
      links: normalizeLinksPageConfig(pages?.['links']),
    },
    setupComplete: raw['setupComplete'] as boolean | undefined,
    setupAcknowledgedSteps: Array.isArray(raw['setupAcknowledgedSteps'])
      ? (raw['setupAcknowledgedSteps'] as string[])
      : undefined,
    adminNavShortcuts: normalizeAdminNavShortcuts(raw['adminNavShortcuts']),
    updatedAt: normalizeTimestamp(raw['updatedAt']),
  };
}
