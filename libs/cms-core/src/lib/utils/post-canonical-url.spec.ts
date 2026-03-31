import type { BlogPost } from '../models/post.model';
import { resolvePostCanonicalUrl } from './post-canonical-url';

function minimalPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'p1',
    slug: 'hello-world',
    title: 'Hello',
    status: 'published',
    content: '',
    tags: [],
    embeddedMedia: {},
    seo: {},
    publishedAt: 0,
    updatedAt: 0,
    createdAt: 0,
    ...overrides,
  };
}

describe('resolvePostCanonicalUrl', () => {
  it('uses /posts/{slug} under base when seo.canonicalUrl is absent', () => {
    const post = minimalPost();
    expect(resolvePostCanonicalUrl(post, 'https://blog.example.com')).toBe(
      'https://blog.example.com/posts/hello-world',
    );
  });

  it('strips trailing slash from baseUrl', () => {
    const post = minimalPost();
    expect(resolvePostCanonicalUrl(post, 'https://blog.example.com/')).toBe(
      'https://blog.example.com/posts/hello-world',
    );
  });

  it('returns seo.canonicalUrl when pathname matches /posts/{slug}', () => {
    const post = minimalPost({
      slug: 'my-post',
      seo: { canonicalUrl: 'https://custom.example/posts/my-post?utm=1' },
    });
    expect(resolvePostCanonicalUrl(post, 'https://blog.example.com')).toBe(
      'https://custom.example/posts/my-post?utm=1',
    );
  });

  it('falls back when seo.canonicalUrl path does not match slug', () => {
    const post = minimalPost({
      slug: 'my-post',
      seo: { canonicalUrl: 'https://custom.example/wrong-path' },
    });
    expect(resolvePostCanonicalUrl(post, 'https://blog.example.com')).toBe(
      'https://blog.example.com/posts/my-post',
    );
  });

  it('falls back when seo.canonicalUrl is not a valid URL', () => {
    const post = minimalPost({
      seo: { canonicalUrl: 'not-a-url' },
    });
    expect(resolvePostCanonicalUrl(post, 'https://blog.example.com')).toBe(
      'https://blog.example.com/posts/hello-world',
    );
  });

  it('treats trailing slash on pathname as matching', () => {
    const post = minimalPost({
      slug: 'x',
      seo: { canonicalUrl: 'https://a.example/posts/x/' },
    });
    expect(resolvePostCanonicalUrl(post, 'https://blog.example.com')).toBe(
      'https://a.example/posts/x/',
    );
  });
});
