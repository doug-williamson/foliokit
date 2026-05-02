import type {
  SiteConfig,
  SiteProfile,
  AboutPageConfig,
  LinksPageConfig,
  HomePageConfig,
  BlogPageConfig,
} from '../models/site-config.model';
import {
  normalizeTimestamp,
  normalizeSocialLinks,
  normalizeSeoMeta,
  normalizeLinksLinks,
} from './normalize';

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

function normalizeSiteProfile(raw: unknown): SiteProfile | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  return {
    displayName: (r['displayName'] as string | null) ?? null,
    photoUrl: (r['photoUrl'] as string | null) ?? null,
    photoUrlDark: (r['photoUrlDark'] as string | null) ?? null,
    photoAlt: (r['photoAlt'] as string | null) ?? null,
    socialLinks: Array.isArray(r['socialLinks'])
      ? normalizeSocialLinks(r['socialLinks'])
      : undefined,
  };
}

function normalizeBlogPageConfig(raw: unknown): BlogPageConfig | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  return {
    enabled: (r['enabled'] as boolean) ?? false,
    seo: normalizeSeoMeta(r['seo']),
  };
}

export function normalizeSiteConfig(raw: Record<string, unknown>): SiteConfig {
  const pages = raw['pages'] as Record<string, unknown> | undefined;

  const normalizedPages = {
    home: normalizeHomePageConfig(pages?.['home']),
    blog: normalizeBlogPageConfig(pages?.['blog']),
    about: normalizeAboutPageConfig(pages?.['about']),
    links: normalizeLinksPageConfig(pages?.['links']),
  };

  // Backfill for tenants that completed onboarding before this flag existed:
  // if the doc doesn't have the flag but all four pages are currently enabled,
  // treat onboarding as complete so the full shell is shown.
  const onboardingComplete: boolean =
    raw['onboardingComplete'] === true ||
    (normalizedPages.home?.enabled === true &&
      normalizedPages.blog?.enabled === true &&
      normalizedPages.about?.enabled === true &&
      normalizedPages.links?.enabled === true);

  return {
    id: (raw['id'] as string) ?? '',
    siteName: (raw['siteName'] as string) ?? '',
    siteUrl: (raw['siteUrl'] as string) ?? '',
    description: raw['description'] as string | undefined,
    logo: raw['logo'] as string | undefined,
    favicon: raw['favicon'] as string | undefined,
    defaultAuthorId: raw['defaultAuthorId'] as string | undefined,
    defaultSeo: normalizeSeoMeta(raw['defaultSeo']),
    profile: normalizeSiteProfile(raw['profile']),
    pages: normalizedPages,
    onboardingComplete,
    updatedAt: normalizeTimestamp(raw['updatedAt']),
  };
}
