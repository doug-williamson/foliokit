import type { LinksLink } from '../../models/page.model';

export function normalizeLinksLinks(raw: unknown): LinksLink[] {
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
