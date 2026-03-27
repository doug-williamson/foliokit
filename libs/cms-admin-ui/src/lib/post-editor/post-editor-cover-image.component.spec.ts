import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { FIREBASE_STORAGE, PostService } from '@foliokit/cms-core';
import { PostEditorStore } from './post-editor.store';
import { PostEditorCoverImageComponent } from './post-editor-cover-image.component';
import type { BlogPost } from '@foliokit/cms-core';

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

function makeFileList(file: File): FileList {
  return Object.assign([file], {
    item: (i: number) => (i === 0 ? file : null),
    length: 1,
  }) as unknown as FileList;
}

/**
 * Builds a mock UploadTask whose `on()` callback arguments are captured so
 * individual tests can invoke the progress / error / complete handlers.
 */
function makeUploadTask() {
  let _progressCb: ((s: { bytesTransferred: number; totalBytes: number }) => void) | null = null;
  let _errorCb: ((e: Error) => void) | null = null;
  let _completeCb: (() => void) | null = null;

  const task = {
    on: vi.fn(
      (
        _evt: string,
        progressCb: typeof _progressCb,
        errorCb: typeof _errorCb,
        completeCb: typeof _completeCb,
      ) => {
        _progressCb = progressCb;
        _errorCb = errorCb;
        _completeCb = completeCb;
      },
    ),
    snapshot: { ref: {} },
    triggerProgress: (transferred: number, total: number) => _progressCb?.({ bytesTransferred: transferred, totalBytes: total }),
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

  const postSignal = signal(makePost(postOverrides));
  const storeStub = {
    post: postSignal,
    updateField: vi.fn(),
    tempPostId: vi.fn(() => 'draft-temp'),
  };

  const postServiceStub = {
    deleteStorageFile: vi.fn(() => ({ subscribe: vi.fn() })),
  };

  TestBed.configureTestingModule({
    imports: [PostEditorCoverImageComponent],
    providers: [
      { provide: PostEditorStore, useValue: storeStub },
      { provide: FIREBASE_STORAGE, useValue: {} },
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: PostService, useValue: postServiceStub },
    ],
  });

  const fixture = TestBed.createComponent(PostEditorCoverImageComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();

  return { fixture, component, storeStub, postServiceStub, postSignal };
}

// ---------------------------------------------------------------------------
// Drag interactions
// ---------------------------------------------------------------------------

function fakeDragEvent(files?: File[]): DragEvent {
  const preventDefault = vi.fn();
  const fileList = files
    ? Object.assign([...files], { item: (i: number) => files[i] ?? null, length: files.length })
    : null;
  return {
    preventDefault,
    dataTransfer: fileList ? { files: fileList } : { files: { length: 0 } },
  } as unknown as DragEvent;
}

describe('PostEditorCoverImageComponent — drag interactions', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('sets isDragOver to true on dragover', () => {
    const { component } = setup();
    const event = fakeDragEvent();

    component.onDragOver(event);

    expect(component.isDragOver()).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('clears isDragOver on dragleave', () => {
    const { component } = setup();
    component.onDragOver(fakeDragEvent());

    component.onDragLeave();

    expect(component.isDragOver()).toBe(false);
  });

  it('clears isDragOver and starts upload on drop with a file', () => {
    const { component } = setup();
    const file = new File(['x'], 'hero.jpg', { type: 'image/jpeg' });
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);

    const event = fakeDragEvent([file]);

    component.onDrop(event);

    expect(component.isDragOver()).toBe(false);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(vi.mocked(uploadBytesResumable)).toHaveBeenCalledTimes(1);
  });

  it('does nothing on drop when dataTransfer has no files', () => {
    const { component } = setup();
    const event = fakeDragEvent([]);
    component.onDrop(event);
    expect(vi.mocked(uploadBytesResumable)).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// onFileSelected
// ---------------------------------------------------------------------------

describe('PostEditorCoverImageComponent — onFileSelected', () => {
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

    component.onFileSelected(makeFileList(new File(['x'], 'a.jpg', { type: 'image/jpeg' })));

    expect(component.uploading()).toBe(true);
  });

  it('updates uploadProgress signal as bytes transfer', () => {
    const { component } = setup();
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);

    component.onFileSelected(makeFileList(new File(['x'], 'a.jpg', { type: 'image/jpeg' })));
    task.triggerProgress(50, 100);

    expect(component.uploadProgress()).toBe(50);
  });

  it('on success: calls store.updateField for thumbnailUrl and thumbnailAlt, clears uploading', async () => {
    const { component, storeStub } = setup();
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);
    vi.mocked(getDownloadURL).mockResolvedValue('https://cdn.example.com/a.jpg');

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    component.onFileSelected(makeFileList(file));
    task.triggerComplete();

    await Promise.resolve(); // flush getDownloadURL microtask

    expect(storeStub.updateField).toHaveBeenCalledWith('thumbnailUrl', 'https://cdn.example.com/a.jpg');
    expect(storeStub.updateField).toHaveBeenCalledWith('thumbnailAlt', 'a.jpg');
    expect(component.uploading()).toBe(false);
  });

  it('uses "draft-temp" as postId when post.id is empty', () => {
    const { component } = setup({ id: '' });
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);

    component.onFileSelected(makeFileList(new File(['x'], 'img.png', { type: 'image/png' })));

    expect(vi.mocked(ref)).toHaveBeenCalledWith(expect.anything(), 'posts/draft-temp/cover/img.png');
  });
});

// ---------------------------------------------------------------------------
// Upload error path
// ---------------------------------------------------------------------------

describe('PostEditorCoverImageComponent — upload error', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('sets uploading to false and uploadError on error', () => {
    const { component } = setup();
    const task = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task as never);

    component.onFileSelected(makeFileList(new File(['x'], 'bad.jpg', { type: 'image/jpeg' })));
    task.triggerError(new Error('Storage quota exceeded'));

    expect(component.uploading()).toBe(false);
    expect(component.uploadError()).toBe('Storage quota exceeded');
  });

  it('clears uploadError when a new upload starts', () => {
    const { component } = setup();
    const task1 = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task1 as never);
    component.onFileSelected(makeFileList(new File(['x'], 'bad.jpg', { type: 'image/jpeg' })));
    task1.triggerError(new Error('first error'));

    expect(component.uploadError()).toBe('first error');

    const task2 = makeUploadTask();
    vi.mocked(uploadBytesResumable).mockReturnValue(task2 as never);
    component.onFileSelected(makeFileList(new File(['x'], 'good.jpg', { type: 'image/jpeg' })));

    expect(component.uploadError()).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// onDeleteCover
// ---------------------------------------------------------------------------

describe('PostEditorCoverImageComponent — onDeleteCover', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('clears thumbnailUrl and thumbnailAlt when user confirms', () => {
    const { component, storeStub } = setup({ thumbnailUrl: 'https://cdn.example.com/cover.jpg' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.onDeleteCover();

    expect(storeStub.updateField).toHaveBeenCalledWith('thumbnailUrl', '');
    expect(storeStub.updateField).toHaveBeenCalledWith('thumbnailAlt', '');
  });

  it('does nothing when user cancels the confirm dialog', () => {
    const { component, storeStub } = setup({ thumbnailUrl: 'https://cdn.example.com/cover.jpg' });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.onDeleteCover();

    expect(storeStub.updateField).not.toHaveBeenCalled();
  });
});
