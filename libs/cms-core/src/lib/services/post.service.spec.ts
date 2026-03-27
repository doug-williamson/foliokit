import { TestBed } from '@angular/core/testing';
import { lastValueFrom } from 'rxjs';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase/firebase.config';
import { PostService } from './post.service';
import {
  fakeTimestamp,
  firestoreStub,
  makeBlogPost,
  mockDocSnapshot,
  mockQuerySnapshot,
} from '../../../testing/firestore.stub';

// ---------------------------------------------------------------------------
// Module mocks — hoisted before all imports by Vitest.
// Replaces every firebase SDK export with vi.fn() so the real SDK
// is never imported or initialised.
// ---------------------------------------------------------------------------
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({ id: 'generated-xyz' })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn((ref: unknown) => ref),
  orderBy: vi.fn((...args: unknown[]) => args),
  where: vi.fn((...args: unknown[]) => args),
  limit: vi.fn((n: number) => n),
  Timestamp: {
    now: vi.fn(() => fakeTimestamp),
    fromMillis: vi.fn(() => fakeTimestamp),
  },
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(() => ({})),
  deleteObject: vi.fn(),
}));

describe('PostService', () => {
  let service: PostService;

  beforeEach(() => {
    vi.clearAllMocks();

    // collection always returns an opaque ref object; doc and query pass it through
    vi.mocked(collection).mockReturnValue({} as ReturnType<typeof collection>);
    vi.mocked(doc).mockReturnValue({ id: 'generated-xyz' } as ReturnType<typeof doc>);
    vi.mocked(query).mockImplementation((ref) => ref as ReturnType<typeof query>);

    TestBed.configureTestingModule({
      providers: [
        PostService,
        { provide: FIRESTORE, useValue: firestoreStub },
        { provide: FIREBASE_STORAGE, useValue: {} },
      ],
    });

    service = TestBed.inject(PostService);
  });

  // -------------------------------------------------------------------------
  describe('getPostById', () => {
    it('returns the mapped BlogPost when the document exists', async () => {
      const raw = {
        slug: 'hello',
        title: 'Hello World',
        status: 'draft',
        content: '',
        tags: [],
        embeddedMedia: {},
        seo: {},
        publishedAt: fakeTimestamp,
        updatedAt: fakeTimestamp,
        createdAt: fakeTimestamp,
      };
      vi.mocked(getDoc).mockResolvedValue(
        mockDocSnapshot('post-abc', raw) as Awaited<ReturnType<typeof getDoc>>,
      );

      const result = await lastValueFrom(service.getPostById('post-abc'));

      // normalizePost converts Firestore Timestamps to milliseconds
      const expectedMs = fakeTimestamp.seconds * 1000;
      expect(result).toMatchObject({
        id: 'post-abc',
        slug: 'hello',
        title: 'Hello World',
        status: 'draft',
        publishedAt: expectedMs,
        updatedAt: expectedMs,
        createdAt: expectedMs,
      });
    });

    it('throws an error when the document does not exist', async () => {
      vi.mocked(getDoc).mockResolvedValue(
        mockDocSnapshot('missing', null) as Awaited<ReturnType<typeof getDoc>>,
      );

      await expect(lastValueFrom(service.getPostById('missing'))).rejects.toThrow(
        'Post not found: missing',
      );
    });
  });

  // -------------------------------------------------------------------------
  describe('getAllPosts', () => {
    it('returns all posts mapped from the snapshot', async () => {
      const post1 = makeBlogPost({ id: 'a', title: 'Post A' });
      const post2 = makeBlogPost({ id: 'b', title: 'Post B' });
      const { id: _1, ...data1 } = post1;
      const { id: _2, ...data2 } = post2;

      vi.mocked(getDocs).mockResolvedValue(
        mockQuerySnapshot([
          { id: 'a', data: data1 as unknown as Record<string, unknown> },
          { id: 'b', data: data2 as unknown as Record<string, unknown> },
        ]) as Awaited<ReturnType<typeof getDocs>>,
      );

      const result = await lastValueFrom(service.getAllPosts());

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('a');
      expect(result[1].id).toBe('b');
    });

    it('passes orderBy("updatedAt", "desc") to query', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        mockQuerySnapshot([]) as Awaited<ReturnType<typeof getDocs>>,
      );

      await lastValueFrom(service.getAllPosts());

      expect(vi.mocked(orderBy)).toHaveBeenCalledWith('updatedAt', 'desc');
    });

    it('returns an empty array when the collection is empty', async () => {
      vi.mocked(getDocs).mockResolvedValue(
        mockQuerySnapshot([]) as Awaited<ReturnType<typeof getDocs>>,
      );

      const result = await lastValueFrom(service.getAllPosts());

      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  describe('savePost — new post (id === "")', () => {
    it('calls setDoc with the generated id and returns the post with that id', async () => {
      const newPost = makeBlogPost({ id: '' });
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await lastValueFrom(service.savePost(newPost));

      expect(vi.mocked(setDoc)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(updateDoc)).not.toHaveBeenCalled();
      expect(result.id).toBe('generated-xyz');
    });

    it('stores the id field inside the document payload', async () => {
      const newPost = makeBlogPost({ id: '' });
      vi.mocked(setDoc).mockResolvedValue(undefined);

      await lastValueFrom(service.savePost(newPost));

      expect(vi.mocked(setDoc)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: 'generated-xyz' }),
      );
    });

    it('stamps createdAt and updatedAt as numeric milliseconds', async () => {
      const newPost = makeBlogPost({ id: '' });
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await lastValueFrom(service.savePost(newPost));

      expect(typeof result.createdAt).toBe('number');
      expect(typeof result.updatedAt).toBe('number');
    });
  });

  // -------------------------------------------------------------------------
  describe('savePost — existing post (id !== "")', () => {
    it('calls updateDoc and returns the post with updated updatedAt', async () => {
      const existingPost = makeBlogPost({ id: 'post-existing' });
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const result = await lastValueFrom(service.savePost(existingPost));

      expect(vi.mocked(updateDoc)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(updateDoc)).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ updatedAt: fakeTimestamp }),
      );
      expect(vi.mocked(setDoc)).not.toHaveBeenCalled();
      expect(result.id).toBe('post-existing');
      expect(typeof result.updatedAt).toBe('number');
    });
  });

  // -------------------------------------------------------------------------
  describe('Timestamp.now mock', () => {
    it('does not call the real Firebase SDK', () => {
      expect(vi.mocked(Timestamp.now)).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('deleteStorageFile', () => {
    it('calls ref() with the storage instance and the given path', async () => {
      vi.mocked(deleteObject).mockResolvedValue(undefined);

      await lastValueFrom(service.deleteStorageFile('posts/p1/cover/img.jpg'));

      expect(vi.mocked(ref)).toHaveBeenCalledWith(
        expect.anything(),
        'posts/p1/cover/img.jpg',
      );
    });

    it('calls deleteObject with the ref returned by ref()', async () => {
      const fakeRef = { _path: 'posts/p1/cover/img.jpg' };
      vi.mocked(ref).mockReturnValue(fakeRef as unknown as ReturnType<typeof ref>);
      vi.mocked(deleteObject).mockResolvedValue(undefined);

      await lastValueFrom(service.deleteStorageFile('posts/p1/cover/img.jpg'));

      expect(vi.mocked(deleteObject)).toHaveBeenCalledWith(fakeRef);
    });

    it('returns an Observable that resolves to void when deleteObject succeeds', async () => {
      vi.mocked(deleteObject).mockResolvedValue(undefined);

      const result = await lastValueFrom(service.deleteStorageFile('any/path'));

      expect(result).toBeUndefined();
    });
  });
});
