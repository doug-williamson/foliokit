import type { SocialLink, SocialPlatform } from '../../models/site-config.model';

export function normalizeSocialLinks(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((item) => ({
    platform: item['platform'] as SocialPlatform,
    url: (item['url'] as string) ?? '',
    label: item['label'] as string | undefined,
    icon: item['icon'] as string | undefined,
  }));
}
