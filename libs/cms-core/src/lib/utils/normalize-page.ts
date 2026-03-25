import type { CmsPageUnion, LinksPage, LinksLink } from '../models/page.model';

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

function normalizeLinks(raw: unknown): LinksLink[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((l, i) => ({
    id: (l['id'] as string) ?? crypto.randomUUID(),
    label: (l['label'] as string) ?? '',
    url: (l['url'] as string) ?? '',
    icon: l['icon'] as string | undefined,
    platform: l['platform'] as LinksLink['platform'],
    highlighted: l['highlighted'] as boolean | undefined,
    order: typeof l['order'] === 'number' ? (l['order'] as number) : i,
  }));
}

export function normalizePage(raw: Record<string, unknown>): CmsPageUnion {
  const base = {
    id: (raw['id'] as string) ?? '',
    slug: (raw['slug'] as string) ?? '',
    title: (raw['title'] as string) ?? '',
    status: (raw['status'] as CmsPageUnion['status']) ?? 'draft',
    seo: (raw['seo'] as CmsPageUnion['seo']) ?? {},
    updatedAt: normalizeTimestamp(raw['updatedAt']),
    createdAt: normalizeTimestamp(raw['createdAt']),
  };

  const page: LinksPage = {
    ...base,
    type: 'links',
    avatarUrl: raw['avatarUrl'] as string | undefined,
    avatarUrlDark: raw['avatarUrlDark'] as string | undefined,
    avatarAlt: raw['avatarAlt'] as string | undefined,
    headline: raw['headline'] as string | undefined,
    bio: raw['bio'] as string | undefined,
    links: normalizeLinks(raw['links']),
  };
  return page;
}
