import type { Author } from './author.model';

/**
 * Persisted SEO block (Firestore: `title`, `description`, `ogImage`, …).
 * Admin four-field reactive forms often use `SeoFields` (`seo-fields.model`) control names and map to this shape.
 */
export interface SeoMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface EmbeddedMediaEntry {
  token: string;
  storagePath: string;
  downloadUrl: string;
  alt: string;
  mimeType: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  content: string;
  excerpt?: string;
  thumbnailUrl?: string;
  thumbnailAlt?: string;
  tags: string[];
  seriesId?: string;
  authorId?: string;
  readingTimeMinutes?: number;
  embeddedMedia: Record<string, EmbeddedMediaEntry>;
  seo: SeoMeta;
  /** Unix milliseconds. Stored as Firestore Timestamp but always normalized on read. */
  publishedAt: number;
  /** Unix milliseconds, optional. */
  scheduledPublishAt?: number;
  /** Unix milliseconds. */
  updatedAt: number;
  /** Unix milliseconds. */
  createdAt: number;
}

/**
 * Shape of the resolved route data for the post-detail route.
 * The resolver places this object under the `'post'` data key.
 */
export interface PostRouteData {
  post: BlogPost | null;
  author: Author | null;
}
