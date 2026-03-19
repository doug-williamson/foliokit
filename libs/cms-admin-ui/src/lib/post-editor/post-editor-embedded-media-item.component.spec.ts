import { TestBed } from '@angular/core/testing';
import { PostEditorStore } from './post-editor.store';
import { PostEditorEmbeddedMediaItemComponent } from './post-editor-embedded-media-item.component';
import type { EmbeddedMediaEntry } from '@foliokit/cms-core';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<EmbeddedMediaEntry> = {}): EmbeddedMediaEntry {
  return {
    token: 'tok-1',
    storagePath: 'posts/post-1/media/tok-1.png',
    downloadUrl: 'https://cdn.example.com/tok-1.png',
    alt: 'tok-1.png',
    mimeType: 'image/png',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup factory
// ---------------------------------------------------------------------------

function setup(entry: EmbeddedMediaEntry = makeEntry(), token = 'tok-1') {
  const storeStub = {
    insertMediaAtCursor: vi.fn(),
    removeEmbeddedMedia: vi.fn(),
  };

  TestBed.configureTestingModule({
    imports: [PostEditorEmbeddedMediaItemComponent],
    providers: [
      { provide: PostEditorStore, useValue: storeStub },
    ],
  });

  const fixture = TestBed.createComponent(PostEditorEmbeddedMediaItemComponent);
  fixture.componentRef.setInput('entry', entry);
  fixture.componentRef.setInput('token', token);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, storeStub };
}

// ---------------------------------------------------------------------------
// onInsert
// ---------------------------------------------------------------------------

describe('PostEditorEmbeddedMediaItemComponent — onInsert()', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('calls store.insertMediaAtCursor with the component token', () => {
    const { component, storeStub } = setup(makeEntry(), 'my-token');

    component.onInsert();

    expect(storeStub.insertMediaAtCursor).toHaveBeenCalledWith('my-token');
  });
});

// ---------------------------------------------------------------------------
// onDelete
// ---------------------------------------------------------------------------

describe('PostEditorEmbeddedMediaItemComponent — onDelete()', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('calls store.removeEmbeddedMedia with the token when user confirms', () => {
    const { component, storeStub } = setup(makeEntry({ alt: 'hero.png' }), 'tok-2');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.onDelete();

    expect(storeStub.removeEmbeddedMedia).toHaveBeenCalledWith('tok-2');
  });

  it('does NOT call store.removeEmbeddedMedia when user cancels', () => {
    const { component, storeStub } = setup(makeEntry(), 'tok-3');
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.onDelete();

    expect(storeStub.removeEmbeddedMedia).not.toHaveBeenCalled();
  });

  it('shows the entry alt text in the confirm message', () => {
    const { component } = setup(makeEntry({ alt: 'my-image.jpg' }), 'tok-4');
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.onDelete();

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('my-image.jpg'));
  });
});
