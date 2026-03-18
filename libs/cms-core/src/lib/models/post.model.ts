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
  type: 'image' | 'video' | 'youtube' | 'vimeo' | 'codepen' | 'iframe';
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  status: 'published' | 'draft' | 'scheduled';
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
