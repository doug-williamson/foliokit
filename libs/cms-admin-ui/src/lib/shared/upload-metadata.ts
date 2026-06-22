import type { UploadMetadata } from 'firebase/storage';

/**
 * Storage metadata applied to every admin image upload.
 *
 * Firebase Storage objects default to `Cache-Control: private, max-age=0`.
 * Social-card crawlers (X/Twitter, Facebook) re-host OG images on their own
 * CDN and refuse to cache/display an origin image marked `private` — so blog
 * cover images never render as link thumbnails. A long public cache makes the
 * `og:image` / `twitter:image` fetchable and cacheable.
 *
 * `immutable` is safe: Firebase mints a fresh download token whenever an object
 * is (re)written, so `getDownloadURL()` returns a new, cache-busted URL on
 * every replace.
 */
export const IMAGE_UPLOAD_METADATA: UploadMetadata = {
  cacheControl: 'public, max-age=31536000, immutable',
};
