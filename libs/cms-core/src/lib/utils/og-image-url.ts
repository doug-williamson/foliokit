import type { BlogPost } from '../models/post.model';

/** CMS / copy-paste sometimes stores `&amp;` in HTTPS URLs; normalize before use in `<img>` or meta tags. */
export function decodeEntitiesInUrl(url: string): string {
  if (!url) return url;
  return url.replace(/&amp;/gi, '&').trim();
}

/**
 * Returns a browser-loadable image URL. Converts Firebase `gs://bucket/path` to the
 * public `firebasestorage.googleapis.com` form used by Open Graph consumers.
 */
export function toPublicImageUrl(url: string): string {
  const u = decodeEntitiesInUrl(url);
  if (!u.startsWith('gs://')) return u;
  const withoutScheme = u.slice(5);
  const slashIdx = withoutScheme.indexOf('/');
  const bucket = withoutScheme.slice(0, slashIdx);
  const path = withoutScheme.slice(slashIdx + 1);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
}

/**
 * Resolves which raw URL to use for a post's share image (before `gs://` conversion),
 * matching public blog `og:image` meta tag behavior.
 */
export function resolvePostOgImageSource(
  post: Pick<BlogPost, 'seo' | 'thumbnailUrl'>,
  defaultOgImage?: string,
): string {
  const rawSeoOgImage = post.seo?.ogImage;
  const ogImageSource =
    rawSeoOgImage && !rawSeoOgImage.startsWith('gs://')
      ? rawSeoOgImage
      : post.thumbnailUrl ?? rawSeoOgImage ?? defaultOgImage ?? '';
  return ogImageSource;
}

/** Full URL suitable for `<img src>` and `og:image` meta tags. */
export function resolvePostOgImageUrl(
  post: Pick<BlogPost, 'seo' | 'thumbnailUrl'>,
  defaultOgImage?: string,
): string {
  return toPublicImageUrl(resolvePostOgImageSource(post, defaultOgImage));
}
