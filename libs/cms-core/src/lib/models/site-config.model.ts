import type { Timestamp } from 'firebase/firestore';

export interface NavItem {
  label: string;
  url: string;
  order?: number;
  external?: boolean;
  icon?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  label?: string;
  icon?: string;
}

export interface SiteConfig {
  id: string;
  siteName: string;
  siteUrl: string;
  description?: string;
  logo?: string;
  favicon?: string;
  nav: NavItem[];
  social: SocialLink[];
  defaultAuthorId?: string;
  updatedAt: Timestamp;
}
