import type { Timestamp } from 'firebase/firestore';
import type { BlogPost } from '../src/lib/models/post.model';

/**
 * Opaque object provided for the FIRESTORE injection token in tests.
 * The actual firebase/firestore module-level functions are mocked via
 * vi.mock('firebase/firestore') in each spec file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const firestoreStub: any = {};

/**
 * Builds a minimal DocumentSnapshot-shaped object for use with mocked getDoc.
 * Pass null for data to simulate a non-existent document.
 */
export function mockDocSnapshot(
  id: string,
  data: Record<string, unknown> | null,
) {
  return {
    id,
    exists: () => data !== null,
    data: () => data ?? undefined,
  };
}

/**
 * Builds a minimal QuerySnapshot-shaped object for use with mocked getDocs.
 */
export function mockQuerySnapshot(
  docs: Array<{ id: string; data: Record<string, unknown> }>,
) {
  return {
    empty: docs.length === 0,
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
    })),
  };
}

/** Fake Timestamp used throughout tests (no Firebase SDK initialisation needed). */
export const fakeTimestamp = { seconds: 1_700_000_000, nanoseconds: 0 } as unknown as Timestamp;

/**
 * Factory for a minimal valid BlogPost. Spread overrides on top.
 */
export function makeBlogPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'post-1',
    slug: 'test-post',
    title: 'Test Post',
    subtitle: '',
    status: 'draft',
    content: '',
    excerpt: '',
    tags: [],
    embeddedMedia: {},
    seo: {},
    publishedAt: fakeTimestamp.seconds * 1000,
    updatedAt: fakeTimestamp.seconds * 1000,
    createdAt: fakeTimestamp.seconds * 1000,
    ...overrides,
  };
}
