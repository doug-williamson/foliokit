import type { SiteConfig, NavItem, SocialLink, SocialPlatform, SeoMeta, AboutPageConfig } from '../models/site-config.model';

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

function normalizeAboutPageConfig(raw: unknown): AboutPageConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const headline = (r['headline'] as string | undefined) ?? '';
  if (!headline && !r['bio']) return undefined;
  return {
    headline,
    subheadline: r['subheadline'] as string | undefined,
    bio: (r['bio'] as string) ?? '',
    photoUrl: r['photoUrl'] as string | undefined,
    photoAlt: r['photoAlt'] as string | undefined,
    socialLinks: Array.isArray(r['socialLinks'])
      ? normalizeSocialLinks(r['socialLinks'])
      : undefined,
    seo: normalizeSeoMeta(r['seo']),
  };
}

export function normalizeSiteConfig(raw: Record<string, unknown>): SiteConfig {
  const pages = raw['pages'] as Record<string, unknown> | undefined;
  const about = normalizeAboutPageConfig(pages?.['about']);

  return {
    id: (raw['id'] as string) ?? '',
    siteName: (raw['siteName'] as string) ?? '',
    siteUrl: (raw['siteUrl'] as string) ?? '',
    description: raw['description'] as string | undefined,
    logo: raw['logo'] as string | undefined,
    favicon: raw['favicon'] as string | undefined,
    primaryColor: raw['primaryColor'] as string | undefined,
    accentColor: raw['accentColor'] as string | undefined,
    nav: normalizeNavItems(raw['nav']),
    defaultAuthorId: raw['defaultAuthorId'] as string | undefined,
    defaultSeo: normalizeSeoMeta(raw['defaultSeo']),
    pages: about ? { about } : undefined,
    updatedAt: normalizeTimestamp(raw['updatedAt']),
  };
}
