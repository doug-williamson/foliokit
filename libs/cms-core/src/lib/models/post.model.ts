import type { Timestamp } from 'firebase/firestore';

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
  authorId?: string;
  readingTimeMinutes?: number;
  embeddedMedia: Record<string, EmbeddedMediaEntry>;
  seo: SeoMeta;
  publishedAt: Timestamp;
  scheduledPublishAt?: Timestamp;
  updatedAt: Timestamp;
  createdAt: Timestamp;
}
