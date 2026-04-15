import type { BlogPost } from '../models/post.model';

/**
 * Converts a Firestore timestamp in any of its runtime forms to milliseconds.
 *
 * Handles:
 *  - Native Timestamp objects from either SDK (have .toMillis())
 *  - Objects with .toDate() method (client SDK Timestamp without .toMillis())
 *  - Admin SDK serialized form { _seconds, _nanoseconds }
 *  - Plain { seconds, nanoseconds } objects
 *  - Already-numeric millisecond values
 *  - JavaScript Date objects
 */
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

/**
 * Maps raw Firestore DocumentData (merged with its doc id) into a fully typed,
 * TransferState-serializable BlogPost. Callers must pass { id: doc.id, ...doc.data() }.
 */
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
    embeddedMedia: (raw['embeddedMedia'] as BlogPost['embeddedMedia']) ?? {},
    seo: (raw['seo'] as BlogPost['seo']) ?? {},
    publishedAt: normalizeTimestamp(raw['publishedAt']),
    scheduledPublishAt:
      raw['scheduledPublishAt'] != null
        ? normalizeTimestamp(raw['scheduledPublishAt'])
        : undefined,
    updatedAt: normalizeTimestamp(raw['updatedAt']),
    createdAt: normalizeTimestamp(raw['createdAt']),
  };
}
