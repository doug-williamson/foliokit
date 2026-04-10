/**
 * Shape of the four main SEO fields in admin reactive forms (control names).
 * Persisted documents use {@link SeoMeta} keys (`title`, `description`, `ogImage`, …).
 */
export interface SeoFields {
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
}
