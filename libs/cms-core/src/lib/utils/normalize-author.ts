import type { Author } from '../models/author.model';
import type { SocialLink, SocialPlatform } from '../models/site-config.model';

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

function normalizeSocialLinks(raw: unknown): SocialLink[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  return (raw as Record<string, unknown>[]).map((item) => ({
    platform: item['platform'] as SocialPlatform,
    url: (item['url'] as string) ?? '',
    label: item['label'] as string | undefined,
    icon: item['icon'] as string | undefined,
  }));
}

export function normalizeAuthor(raw: Record<string, unknown>): Author {
  const displayName =
    (raw['displayName'] as string | undefined)?.trim() ||
    (raw['name'] as string | undefined)?.trim() ||
    '';
  return {
    id: (raw['id'] as string) ?? '',
    displayName,
    bio: raw['bio'] as string | undefined,
    photoUrl:
      (raw['photoUrl'] as string | undefined) ||
      (raw['avatarUrl'] as string | undefined),
    photoUrlDark: raw['photoUrlDark'] as string | undefined,
    socialLinks: normalizeSocialLinks(raw['socialLinks']),
    email: raw['email'] as string | undefined,
    createdAt: normalizeTimestamp(raw['createdAt']),
    updatedAt: normalizeTimestamp(raw['updatedAt']),
  };
}
