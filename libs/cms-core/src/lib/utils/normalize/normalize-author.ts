import type { Author } from '../../models/author.model';
import { normalizeTimestamp } from './normalize-timestamp';
import { normalizeSocialLinks } from './normalize-social-links';

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
    socialLinks: Array.isArray(raw['socialLinks'])
      ? normalizeSocialLinks(raw['socialLinks'])
      : undefined,
    email: raw['email'] as string | undefined,
    createdAt: normalizeTimestamp(raw['createdAt']),
    updatedAt: normalizeTimestamp(raw['updatedAt']),
  };
}
