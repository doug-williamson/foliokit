import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { PostService } from '@foliokit/cms-core';
import { PostEditorStore } from './post-editor.store';
import type { BlogPost } from '@foliokit/cms-core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeTimestamp() {
  return { seconds: 1_700_000_000, nanoseconds: 0 };
}

function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
  const ts = fakeTimestamp() as unknown as BlogPost['publishedAt'];
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
    publishedAt: ts,
    updatedAt: ts,
    createdAt: ts,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

function setup() {
  const postServiceStub = {
    getPostById: vi.fn(),
    savePost: vi.fn(),
    deleteStorageFile: vi.fn().mockReturnValue(of(undefined)),
  };

  TestBed.configureTestingModule({
    providers: [
      PostEditorStore,
      { provide: PostService, useValue: postServiceStub },
    ],
  });

  const store = TestBed.inject(PostEditorStore);
  return { store, postServiceStub };
}

// ---------------------------------------------------------------------------
// initNew
// ---------------------------------------------------------------------------

describe('PostEditorStore.initNew()', () => {
  it('sets mode to "new"', () => {
    const { store } = setup();
    store.initNew();
    expect(store.mode()).toBe('new');
  });

  it('sets isDirty to false', () => {
    const { store } = setup();
    store.initNew();
    expect(store.isDirty()).toBe(false);
  });

  it('sets isSaving to false', () => {
    const { store } = setup();
    store.initNew();
    expect(store.isSaving()).toBe(false);
  });

  it('initialises post as a blank draft with status "draft"', () => {
    const { store } = setup();
    store.initNew();

    const post = store.post();
    expect(post).not.toBeNull();
    expect(post!.id).toBe('');
    expect(post!.slug).toBe('');
    expect(post!.title).toBe('');
    expect(post!.status).toBe('draft');
    expect(post!.tags).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// loadPost
// ---------------------------------------------------------------------------

describe('PostEditorStore.loadPost(id)', () => {
  it('calls postService.getPostById with the given id', () => {
    const { store, postServiceStub } = setup();
    const mockPost = makePost();
    postServiceStub.getPostById.mockReturnValue(of(mockPost));

    store.loadPost('post-1');

    expect(postServiceStub.getPostById).toHaveBeenCalledWith('post-1');
  });

  it('patches post with the value returned by the service', () => {
    const { store, postServiceStub } = setup();
    const mockPost = makePost({ title: 'Loaded Post' });
    postServiceStub.getPostById.mockReturnValue(of(mockPost));

    store.loadPost('post-1');

    expect(store.post()).toEqual(mockPost);
  });

  it('sets mode to "edit"', () => {
    const { store, postServiceStub } = setup();
    postServiceStub.getPostById.mockReturnValue(of(makePost()));

    store.loadPost('post-1');

    expect(store.mode()).toBe('edit');
  });

  it('sets isDirty to false', () => {
    const { store, postServiceStub } = setup();
    postServiceStub.getPostById.mockReturnValue(of(makePost()));

    store.loadPost('post-1');

    expect(store.isDirty()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// updateField
// ---------------------------------------------------------------------------

describe('PostEditorStore.updateField(field, value)', () => {
  it('updates the specified field on the post', () => {
    const { store } = setup();
    store.initNew();

    store.updateField('title', 'New Title');

    expect(store.post()!.title).toBe('New Title');
  });

  it('sets isDirty to true', () => {
    const { store } = setup();
    store.initNew();

    store.updateField('slug', 'new-slug');

    expect(store.isDirty()).toBe(true);
  });

  it('does nothing when post is null', () => {
    const { store } = setup();
    // post starts as null; no initNew called

    store.updateField('title', 'Should not apply');

    expect(store.post()).toBeNull();
    expect(store.isDirty()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// save
// ---------------------------------------------------------------------------

describe('PostEditorStore.save()', () => {
  it('sets isSaving to true before the observable resolves', () => {
    const { store, postServiceStub } = setup();
    store.initNew();
    store.updateField('title', 'Draft');

    const saveSubject = new Subject<BlogPost>();
    postServiceStub.savePost.mockReturnValue(saveSubject.asObservable());

    store.save();

    expect(store.isSaving()).toBe(true);

    // Clean up
    saveSubject.complete();
  });

  it('on success: patches post, sets isDirty to false, isSaving to false, mode to "edit"', () => {
    const { store, postServiceStub } = setup();
    store.initNew();
    store.updateField('title', 'Draft');

    const savedPost = makePost({ id: 'saved-1', title: 'Draft' });
    postServiceStub.savePost.mockReturnValue(of(savedPost));

    store.save();

    expect(store.post()).toEqual(savedPost);
    expect(store.isDirty()).toBe(false);
    expect(store.isSaving()).toBe(false);
    expect(store.mode()).toBe('edit');
  });

  it('on error: sets isSaving to false and saveError to the error message', () => {
    const { store, postServiceStub } = setup();
    store.initNew();
    store.updateField('title', 'Draft');

    postServiceStub.savePost.mockReturnValue(
      throwError(() => new Error('Network failure')),
    );

    store.save();

    expect(store.isSaving()).toBe(false);
    expect(store.saveError()).toBe('Network failure');
  });

  it('does nothing when post is null', () => {
    const { store, postServiceStub } = setup();

    store.save();

    expect(postServiceStub.savePost).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// publish
// ---------------------------------------------------------------------------

describe('PostEditorStore.publish()', () => {
  it('calls savePost with status "published"', () => {
    const { store, postServiceStub } = setup();
    store.initNew();
    store.updateField('title', 'My Post');

    const savedPost = makePost({ id: 'pub-1', status: 'published' });
    postServiceStub.savePost.mockReturnValue(of(savedPost));

    store.publish();

    expect(postServiceStub.savePost).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'published' }),
    );
  });

  it('uses the same publishedAt timestamp in the save payload and the patched state', () => {
    const { store, postServiceStub } = setup();
    store.initNew();
    store.updateField('title', 'My Post');

    // Use a deferred Subject so we can inspect state *before* the save
    // result overwrites it with the saved post's timestamps.
    const saveSubject = new Subject<BlogPost>();
    postServiceStub.savePost.mockReturnValue(saveSubject.asObservable());

    store.publish();

    // At this point patchState has already been called with the 'published'
    // post but the subscription hasn't resolved yet — both the payload and
    // the current store state must share the same publishedAt value.
    const [calledWith] = postServiceStub.savePost.mock.calls[0] as [BlogPost];
    expect(calledWith.publishedAt).toBeDefined();
    expect(calledWith.publishedAt).toEqual(store.post()?.publishedAt);

    // Clean up
    saveSubject.complete();
  });

  it('on success: patches state with saved post, sets isDirty to false, isSaving to false', () => {
    const { store, postServiceStub } = setup();
    store.initNew();
    store.updateField('title', 'My Post');

    const savedPost = makePost({ id: 'pub-1', status: 'published' });
    postServiceStub.savePost.mockReturnValue(of(savedPost));

    store.publish();

    expect(store.post()).toEqual(savedPost);
    expect(store.isDirty()).toBe(false);
    expect(store.isSaving()).toBe(false);
  });

  it('on error: sets saveError, rolls back status to pre-publish value, restores publishedAt', () => {
    const { store, postServiceStub } = setup();
    store.initNew();
    store.updateField('title', 'My Post');

    const prevPublishedAt = store.post()!.publishedAt;

    postServiceStub.savePost.mockReturnValue(
      throwError(() => new Error('Publish failed')),
    );

    store.publish();

    expect(store.saveError()).toBe('Publish failed');
    expect(store.isSaving()).toBe(false);
    expect(store.post()!.status).toBe('draft');
    expect(store.post()!.publishedAt).toBe(prevPublishedAt);
  });

  it('does nothing when post is null', () => {
    const { store, postServiceStub } = setup();

    store.publish();

    expect(postServiceStub.savePost).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// canPublish computed
// ---------------------------------------------------------------------------

describe('PostEditorStore canPublish computed', () => {
  it('returns false when post is null', () => {
    const { store } = setup();
    expect(store.canPublish()).toBe(false);
  });

  it('returns false when post title is empty', () => {
    const { store } = setup();
    store.initNew(); // title is ''
    expect(store.canPublish()).toBe(false);
  });

  it('returns false when post title is only whitespace', () => {
    const { store } = setup();
    store.initNew();
    store.updateField('title', '   ');
    expect(store.canPublish()).toBe(false);
  });

  it('returns false when post status is "published"', () => {
    const { store, postServiceStub } = setup();
    postServiceStub.getPostById.mockReturnValue(
      of(makePost({ title: 'Already Published', status: 'published' })),
    );
    store.loadPost('post-1');
    expect(store.canPublish()).toBe(false);
  });

  it('returns true when post has a title and status is "draft"', () => {
    const { store } = setup();
    store.initNew();
    store.updateField('title', 'Valid Draft');
    expect(store.canPublish()).toBe(true);
  });

  it('coerces legacy "scheduled" posts to draft on load; canPublish stays true', () => {
    const { store, postServiceStub } = setup();
    postServiceStub.getPostById.mockReturnValue(
      of(makePost({ title: 'Scheduled', status: 'scheduled' })),
    );
    store.loadPost('post-1');
    expect(store.post()?.status).toBe('draft');
    expect(store.canPublish()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Autosave: debounced writes run in PostEditorPageComponent, not the store.
// ---------------------------------------------------------------------------

describe('PostEditorStore (no internal autosave timer)', () => {
  it('does not call savePost when only updateField runs (no component debounce)', () => {
    const postServiceStub = { getPostById: vi.fn(), savePost: vi.fn() };
    TestBed.configureTestingModule({
      providers: [PostEditorStore, { provide: PostService, useValue: postServiceStub }],
    });
    const store = TestBed.inject(PostEditorStore);
    store.initNew();
    store.updateField('title', 'x');
    TestBed.flushEffects();
    expect(postServiceStub.savePost).not.toHaveBeenCalled();
    TestBed.resetTestingModule();
  });
});

// ---------------------------------------------------------------------------
// setCursorPosition
// ---------------------------------------------------------------------------

describe('PostEditorStore.setCursorPosition(position)', () => {
  it('sets cursorPosition to the given value', () => {
    const { store } = setup();
    store.setCursorPosition(42);
    expect(store.cursorPosition()).toBe(42);
  });

  it('updates cursorPosition when called a second time', () => {
    const { store } = setup();
    store.setCursorPosition(10);
    store.setCursorPosition(99);
    expect(store.cursorPosition()).toBe(99);
  });
});

// ---------------------------------------------------------------------------
// insertMediaAtCursor
// ---------------------------------------------------------------------------

describe('PostEditorStore.insertMediaAtCursor(token)', () => {
  it('does nothing when post is null', () => {
    const { store } = setup();
    // post starts as null; no initNew called
    store.insertMediaAtCursor('tok-1');
    expect(store.post()).toBeNull();
    expect(store.isDirty()).toBe(false);
  });

  it('prepends insertion when cursorPosition is 0', () => {
    const { store } = setup();
    store.initNew();
    store.updateField('content', 'world');
    store.setCursorPosition(0);
    store.insertMediaAtCursor('tok-1');
    expect(store.post()!.content).toBe('![alt](tok-1)world');
  });

  it('inserts at the correct mid-string position', () => {
    const { store } = setup();
    store.initNew();
    store.updateField('content', 'helloworld');
    store.setCursorPosition(5);
    store.insertMediaAtCursor('tok-2');
    expect(store.post()!.content).toBe('hello![alt](tok-2)world');
  });

  it('advances cursorPosition by the length of the insertion', () => {
    const { store } = setup();
    store.initNew();
    store.updateField('content', 'abc');
    store.setCursorPosition(3);
    store.insertMediaAtCursor('tok-3');
    const insertion = '![alt](tok-3)';
    expect(store.cursorPosition()).toBe(3 + insertion.length);
  });

  it('sets isDirty to true', () => {
    const { store } = setup();
    store.initNew();
    // Reset isDirty that updateField sets
    store.setCursorPosition(0);
    // initNew itself leaves isDirty false; just call insertMediaAtCursor
    store.initNew();
    store.insertMediaAtCursor('tok-4');
    expect(store.isDirty()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// removeEmbeddedMedia
// ---------------------------------------------------------------------------

describe('PostEditorStore.removeEmbeddedMedia(token)', () => {
  const fakeTs = { seconds: 1_700_000_000, nanoseconds: 0 } as unknown as BlogPost['publishedAt'];

  function makeEntry(token: string) {
    return {
      token,
      storagePath: `posts/post-1/media/${token}.png`,
      downloadUrl: `https://cdn.example.com/${token}.png`,
      alt: `${token}.png`,
      mimeType: 'image/png',
    };
  }

  it('does nothing when post is null', () => {
    const { store, postServiceStub } = setup();
    store.removeEmbeddedMedia('missing');
    expect(store.post()).toBeNull();
    expect(postServiceStub.deleteStorageFile).not.toHaveBeenCalled();
  });

  it('removes the entry with the given token from embeddedMedia', () => {
    const { store, postServiceStub } = setup();
    postServiceStub.getPostById.mockReturnValue(
      of(makePost({
        embeddedMedia: {
          'tok-a': makeEntry('tok-a'),
          'tok-b': makeEntry('tok-b'),
        },
      })),
    );
    store.loadPost('post-1');

    store.removeEmbeddedMedia('tok-a');

    expect(store.post()!.embeddedMedia).not.toHaveProperty('tok-a');
    expect(store.post()!.embeddedMedia).toHaveProperty('tok-b');
  });

  it('sets isDirty to true', () => {
    const { store, postServiceStub } = setup();
    postServiceStub.getPostById.mockReturnValue(
      of(makePost({ embeddedMedia: { 'tok-a': makeEntry('tok-a') } })),
    );
    store.loadPost('post-1');

    store.removeEmbeddedMedia('tok-a');

    expect(store.isDirty()).toBe(true);
  });

  it('calls postService.deleteStorageFile with the entry storagePath', () => {
    const { store, postServiceStub } = setup();
    const entry = makeEntry('tok-a');
    postServiceStub.getPostById.mockReturnValue(
      of(makePost({ embeddedMedia: { 'tok-a': entry } })),
    );
    store.loadPost('post-1');

    store.removeEmbeddedMedia('tok-a');

    expect(postServiceStub.deleteStorageFile).toHaveBeenCalledWith(entry.storagePath);
  });

  it('does NOT call deleteStorageFile when the token is not in embeddedMedia', () => {
    const { store, postServiceStub } = setup();
    postServiceStub.getPostById.mockReturnValue(
      of(makePost({ embeddedMedia: {} })),
    );
    store.loadPost('post-1');

    store.removeEmbeddedMedia('non-existent');

    expect(postServiceStub.deleteStorageFile).not.toHaveBeenCalled();
  });
});
