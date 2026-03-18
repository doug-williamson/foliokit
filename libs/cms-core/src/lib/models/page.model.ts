import type { Timestamp } from 'firebase/firestore';
import type { SeoMeta } from './post.model';

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  status: 'published' | 'draft';
  content?: string;
  seo: SeoMeta;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface LinktreeLink {
  label: string;
  url: string;
  icon?: string;
  order: number;
}

export interface HomePage extends CmsPage {
  heroHeadline?: string;
  heroSubheadline?: string;
  heroCta?: { label: string; href: string };
  featuredPostIds?: string[];
}

export interface AboutPage extends CmsPage {
  bio?: string;
  skills?: string[];
  avatarUrl?: string;
}

export interface LinktreePage extends CmsPage {
  links: LinktreeLink[];
  avatarUrl?: string;
  displayName?: string;
}
