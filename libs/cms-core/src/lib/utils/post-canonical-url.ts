import type { BlogPost } from '../models/post.model';

/**
 * Resolves the canonical public URL for a blog post.
 *
 * Open Graph consumers expect this to match the link users share. Stored
 * `seo.canonicalUrl` can omit `/posts/`; Facebook then treats og:url vs share URL as a
 * mismatch and often drops image/title from the link preview.
 */
export function resolvePostCanonicalUrl(post: BlogPost, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, '');
  const fallback = `${base}/posts/${post.slug}`;
  const fromSeo = post.seo?.canonicalUrl?.trim();
  if (!fromSeo) return fallback;
  try {
    const u = new URL(fromSeo);
    const path = (u.pathname.replace(/\/$/, '') || '/') as string;
    const expected = `/posts/${post.slug}`;
    if (path === expected) {
      return fromSeo;
    }
  } catch {
    /* invalid URL — use fallback */
  }
  return fallback;
}
