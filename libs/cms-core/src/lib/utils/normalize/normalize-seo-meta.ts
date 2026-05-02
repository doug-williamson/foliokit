import type { SeoMeta } from '../../models/post.model';

export function normalizeSeoMeta(raw: unknown): SeoMeta | undefined {
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
