import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FIREBASE_STORAGE } from '@foliokit/cms-core';
import { PostEditorStore } from './post-editor.store';
import { PostEditorEmbeddedMediaComponent } from './post-editor-embedded-media.component';
import type { BlogPost, EmbeddedMediaEntry } from '@foliokit/cms-core';

// ---------------------------------------------------------------------------
// Module mock — hoisted by Vitest before imports.
// ---------------------------------------------------------------------------
vi.mock('firebase/storage', () => ({
  ref: vi.fn(() => ({})),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_TOKEN = 'aaaaaaaa-0000-0000-0000-000000000001';

vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => FAKE_TOKEN),
});

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

function makeEntry(token: string): EmbeddedMediaEntry {
  return {
    token,
    storagePath: `posts/post-1/media/${token}.png`,
    downloadUrl: `https://cdn.example.com/${token}.png`,
    alt: `${token}.png`,
    mimeType: 'image/png',
  };
}

function makeFileList(file: File): FileList {
  return Object.assign([file], {
    item: (i: number) => (i === 0 ? file : null),
    length: 1,
  }) as unknown as FileList;
}

function makeUploadTask() {
  let _errorCb: ((e: Error) => void) | null = null;
  let _completeCb: (() => void) | null = null;

  const task = {
    on: vi.fn(
      (
        _evt: string,
        _progressCb: null,
        errorCb: typeof _errorCb,
        completeCb: typeof _completeCb,
      ) => {
        _errorCb = errorCb;
        _completeCb = completeCb;
      },
    ),
    snapshot: { ref: {} },
    triggerError: (err: Error) => _errorCb?.(err),
    triggerComplete: () => _completeCb?.(),
  };
  return task;
}

// ---------------------------------------------------------------------------
// Setup factory
// ---------------------------------------------------------------------------

function setup(postOverrides: Partial<BlogPost> = {}) {
  vi.clearAllMocks();
  vi.mocked(crypto.randomUUID).mockReturnValue(FAKE_TOKEN as ReturnType<typeof crypto.randomUUID>);

  const postSignal = signal(makePost(postOverrides));
  const storeStub = {
    post: postSignal,
    updateField: vi.fn(),
    tempPostId: vi.fn(() => 'draft-temp'),
  };

  TestBed.configureTestingModule({
    imports: [PostEditorEmbeddedMediaComponent],
    providers: [
      { provide: PostEditorStore, useValue: storeStub },
      { provide: FIREBASE_STORAGE, useValue: {} },
      { provide: PLATFORM_ID, useValue: 'browser' },
    ],
  });

  const fixture = TestBed.createComponent(PostEditorEmbeddedMediaComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, storeStub, postSignal };
}

// ---------------------------------------------------------------------------
// entries computed
// ---------------------------------------------------------------------------

describe('PostEditorEmbeddedMediaComponent — entries computed', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('returns an empty array when embeddedMedia is empty', () => {
    const { component } = setup();
    expect(component.entries()).toHaveLength(0);
  });

  it('returns one entry when embeddedMedia has one item', () => {
    const entry = makeEntry('tok-a');
    const { component } = setup({ embeddedMedia: { 'tok-a': entry } });
    expect(component.entries()).toHaveLength(1);
    expect(component.entries()[0]).toEqual(entry);
  });

  it('returns all entries when embeddedMedia has multiple items', () => {
    const entryA = makeEntry('tok-a');
    const entryB = makeEntry('tok-b');
    const { component } = setup({
      embeddedMedia: { 'tok-a': entryA, 'tok-b': entryB },
    });
    expect(component.entries()).toHaveLength(2);
  });

  it('updates reactively when the post signal changes', () => {
    const { component, postSignal } = setup();
    expect(component.entries()).toHaveLength(0);

    const entry = makeEntry('tok-x');
    postSignal.set(makePost({ embeddedMedia: { 'tok-x': entry } }));

    expect(component.entries()).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// onFileSelected
// ---------------------------------------------------------------------------

describe('PostEditorEmbeddedMediaComponent — onFileSelected', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('does nothing when files is null', () => {
    const { component } = setup();
    component.onFileSelected(null);
    expect(vi.mocked(uploadBytesResumable)).not.toHaveBeenCalled();
  });

  it('does nothing when FileList is empty', () => {
    const { component } = setup();
    const empty = Object.assign([], { item: () => null, length: 0 }) as unknown as FileList;
    component.onFileSelected(empty);
    expect(vi.mocked(uploadBytesResumable)).not.toHaveBeenCalled();
  });

  it('sets uploading to true when upload starts', () => {
    const { component } = setup();
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);

    component.onFileSelected(makeFileList(new File(['x'], 'photo.jpg', { type: 'image/jpeg' })));

    expect(component.uploading()).toBe(true);
  });

  it('on success: calls store.updateField("embeddedMedia", ...) with the new entry keyed by token', async () => {
    const { component, storeStub } = setup();
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);
    vi.mocked(getDownloadURL).mockResolvedValue('https://cdn.example.com/photo.jpg');

    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    component.onFileSelected(makeFileList(file));
    task.triggerComplete();

    await Promise.resolve(); // flush getDownloadURL microtask

    expect(storeStub.updateField).toHaveBeenCalledWith(
      'embeddedMedia',
      expect.objectContaining({
        [FAKE_TOKEN]: expect.objectContaining({
          token: FAKE_TOKEN,
          downloadUrl: 'https://cdn.example.com/photo.jpg',
          alt: 'photo.jpg',
          mimeType: 'image/jpeg',
        }),
      }),
    );
  });

  it('on success: clears uploading after the entry is stored', async () => {
    const { component } = setup();
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);
    vi.mocked(getDownloadURL).mockResolvedValue('https://cdn.example.com/ok.jpg');

    component.onFileSelected(makeFileList(new File(['x'], 'ok.jpg', { type: 'image/jpeg' })));
    task.triggerComplete();
    await Promise.resolve();

    expect(component.uploading()).toBe(false);
  });

  it('on success: preserves existing embeddedMedia entries', async () => {
    const existing = makeEntry('tok-existing');
    const { component, storeStub } = setup({ embeddedMedia: { 'tok-existing': existing } });
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);
    vi.mocked(getDownloadURL).mockResolvedValue('https://cdn.example.com/new.jpg');

    component.onFileSelected(makeFileList(new File(['x'], 'new.jpg', { type: 'image/jpeg' })));
    task.triggerComplete();
    await Promise.resolve();

    const [, passedMedia] = storeStub.updateField.mock.calls[0] as [string, Record<string, EmbeddedMediaEntry>];
    expect(passedMedia).toHaveProperty('tok-existing');
    expect(passedMedia).toHaveProperty(FAKE_TOKEN);
  });

  it('uses "draft-temp" as postId when post.id is empty', () => {
    const { component } = setup({ id: '' });
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);

    component.onFileSelected(makeFileList(new File(['x'], 'img.png', { type: 'image/png' })));

    expect(vi.mocked(ref)).toHaveBeenCalledWith(expect.anything(), 'posts/draft-temp/media/img.png');
  });
});

// ---------------------------------------------------------------------------
// Upload error path
// ---------------------------------------------------------------------------

describe('PostEditorEmbeddedMediaComponent — upload error', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('sets uploadError to the error message on failure', () => {
    const { component } = setup();
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);

    component.onFileSelected(makeFileList(new File(['x'], 'bad.jpg', { type: 'image/jpeg' })));
    task.triggerError(new Error('Upload failed: permission denied'));

    expect(component.uploadError()).toBe('Upload failed: permission denied');
  });

  it('sets uploading to false on failure', () => {
    const { component } = setup();
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);

    component.onFileSelected(makeFileList(new File(['x'], 'bad.jpg', { type: 'image/jpeg' })));
    task.triggerError(new Error('Network error'));

    expect(component.uploading()).toBe(false);
  });

  it('clears uploadError when a subsequent upload begins', () => {
    const { component } = setup();
    const task1 = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task1 as never);
    component.onFileSelected(makeFileList(new File(['x'], 'bad.jpg', { type: 'image/jpeg' })));
    task1.triggerError(new Error('first error'));
    expect(component.uploadError()).toBe('first error');

    const task2 = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task2 as never);
    component.onFileSelected(makeFileList(new File(['x'], 'ok.jpg', { type: 'image/jpeg' })));

    expect(component.uploadError()).toBeNull();
  });
});
