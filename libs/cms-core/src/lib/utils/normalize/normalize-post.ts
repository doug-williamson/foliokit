import type { BlogPost, EmbeddedMediaEntry, SeoMeta } from '../../models/post.model';
import { normalizeTimestamp } from './normalize-timestamp';
import { normalizeSeoMeta } from './normalize-seo-meta';

export function normalizePost(raw: Record<string, unknown>): BlogPost {
  return {
    id: (raw['id'] as string) ?? '',
    slug: (raw['slug'] as string) ?? '',
    title: (raw['title'] as string) ?? '',
    subtitle: raw['subtitle'] as string | undefined,
    status: raw['status'] as BlogPost['status'],
    content: (raw['content'] as string) ?? '',
    excerpt: raw['excerpt'] as string | undefined,
    thumbnailUrl: raw['thumbnailUrl'] as string | undefined,
    thumbnailAlt: raw['thumbnailAlt'] as string | undefined,
    tags: (raw['tags'] as string[]) ?? [],
    authorId: raw['authorId'] as string | undefined,
    seriesId: raw['seriesId'] as string | undefined,
    seriesOrder: raw['seriesOrder'] as number | undefined,
    readingTimeMinutes: raw['readingTimeMinutes'] as number | undefined,
    embeddedMedia:
      (raw['embeddedMedia'] as Record<string, EmbeddedMediaEntry>) ?? {},
    seo: normalizeSeoMeta(raw['seo']) ?? ({} as SeoMeta),
    publishedAt: normalizeTimestamp(raw['publishedAt']),
    scheduledPublishAt:
      raw['scheduledPublishAt'] != null
        ? normalizeTimestamp(raw['scheduledPublishAt'])
        : undefined,
    updatedAt: normalizeTimestamp(raw['updatedAt']),
    createdAt: normalizeTimestamp(raw['createdAt']),
  };
}
