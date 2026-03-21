import { Component, input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PostEditorStore } from '@foliokit/cms-admin-ui';
import { MarkdownComponent } from '@foliokit/cms-markdown';
import type { BlogPost } from '@foliokit/cms-core';
import { ArticlePreviewComponent } from './article-preview.component';

// ---------------------------------------------------------------------------
// MarkdownComponent stub — avoids pulling in ngx-markdown and its deps
// ---------------------------------------------------------------------------

@Component({
  selector: 'folio-markdown',
  standalone: true,
  template: '',
})
class MarkdownComponentStub {
  readonly content = input.required<string>();
  readonly embeddedMedia = input<Record<string, unknown>>({});
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
  const now = Date.now();
  return {
    id: 'post-1',
    slug: 'test-post',
    title: 'Test Post',
    subtitle: '',
    status: 'draft',
    content: 'Some content',
    excerpt: '',
    tags: [],
    embeddedMedia: {},
    seo: {},
    publishedAt: now,
    updatedAt: now,
    createdAt: now,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function setup() {
  const postSignal = signal<BlogPost | null>(null);

  TestBed.configureTestingModule({
    imports: [ArticlePreviewComponent],
    providers: [
      { provide: PostEditorStore, useValue: { post: postSignal } },
    ],
  }).overrideComponent(ArticlePreviewComponent, {
    remove: { imports: [MarkdownComponent] },
    add: { imports: [MarkdownComponentStub] },
  });

  const fixture: ComponentFixture<ArticlePreviewComponent> =
    TestBed.createComponent(ArticlePreviewComponent);
  fixture.detectChanges();

  return { fixture, postSignal };
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

describe('ArticlePreviewComponent — title', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders the post title in h1', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ title: 'Hello World' }));
    fixture.detectChanges();

    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1).not.toBeNull();
    expect(h1.nativeElement.textContent.trim()).toBe('Hello World');
  });

  it('renders "Untitled post" placeholder when title is empty', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ title: '' }));
    fixture.detectChanges();

    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1).not.toBeNull();
    expect(h1.nativeElement.textContent.trim()).toBe('Untitled post');
  });
});

// ---------------------------------------------------------------------------
// Subtitle
// ---------------------------------------------------------------------------

describe('ArticlePreviewComponent — subtitle', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders h2 when subtitle is present', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ subtitle: 'A great subtitle' }));
    fixture.detectChanges();

    const h2 = fixture.debugElement.query(By.css('h2'));
    expect(h2).not.toBeNull();
    expect(h2.nativeElement.textContent.trim()).toBe('A great subtitle');
  });

  it('omits h2 when subtitle is absent', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ subtitle: '' }));
    fixture.detectChanges();

    const h2 = fixture.debugElement.query(By.css('h2'));
    expect(h2).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Reading time
// ---------------------------------------------------------------------------

describe('ArticlePreviewComponent — reading time', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders reading time when readingTimeMinutes is set', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ readingTimeMinutes: 5 }));
    fixture.detectChanges();

    const metaRow = fixture.debugElement.query(By.css('p'));
    expect(metaRow.nativeElement.textContent).toContain('min read');
  });

  it('omits reading time when readingTimeMinutes is absent', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ readingTimeMinutes: undefined }));
    fixture.detectChanges();

    const metaRow = fixture.debugElement.query(By.css('p'));
    expect(metaRow.nativeElement.textContent).not.toContain('min read');
  });
});

// ---------------------------------------------------------------------------
// Content / empty state
// ---------------------------------------------------------------------------

describe('ArticlePreviewComponent — content', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('shows "No content yet." empty state when content is empty string', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ content: '' }));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No content yet.');
    const markdown = fixture.debugElement.query(By.css('folio-markdown'));
    expect(markdown).toBeNull();
  });

  it('renders folio-markdown element when content is non-empty', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ content: '## Hello' }));
    fixture.detectChanges();

    const markdown = fixture.debugElement.query(By.css('folio-markdown'));
    expect(markdown).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Null post
// ---------------------------------------------------------------------------

describe('ArticlePreviewComponent — null post', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders nothing when post() returns null', () => {
    const { fixture } = setup();
    // postSignal starts as null; detectChanges already called in setup()

    const h1 = fixture.debugElement.query(By.css('h1'));
    expect(h1).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Reactivity
// ---------------------------------------------------------------------------

describe('ArticlePreviewComponent — reactivity', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('updates the DOM when postSignal is updated and detectChanges() is called', () => {
    const { fixture, postSignal } = setup();

    postSignal.set(makePost({ title: 'Initial Title' }));
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('h1')).nativeElement.textContent.trim(),
    ).toBe('Initial Title');

    postSignal.set(makePost({ title: 'Updated Title' }));
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('h1')).nativeElement.textContent.trim(),
    ).toBe('Updated Title');
  });

  it('transitions from null to a post and back to null correctly', () => {
    const { fixture, postSignal } = setup();

    expect(fixture.debugElement.query(By.css('h1'))).toBeNull();

    postSignal.set(makePost({ title: 'A Post' }));
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('h1'))).not.toBeNull();

    postSignal.set(null);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('h1'))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// publishedAt date rendering
// ---------------------------------------------------------------------------

describe('ArticlePreviewComponent — publishedAt date', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders publishedAt as a sane date (not in the 2090s)', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ publishedAt: Date.now() }));
    fixture.detectChanges();

    const metaText: string = fixture.debugElement.query(By.css('p')).nativeElement.textContent;
    expect(metaText).not.toMatch(/209\d/);
    expect(metaText).toContain('2026');
  });

  it('formats publishedAt as "MMM d, yyyy"', () => {
    const { fixture, postSignal } = setup();
    // Use a fixed, known timestamp: Jan 15, 2026 00:00:00 UTC
    const jan15 = new Date('2026-01-15T12:00:00Z').getTime();
    postSignal.set(makePost({ publishedAt: jan15 }));
    fixture.detectChanges();

    const metaText: string = fixture.debugElement.query(By.css('p')).nativeElement.textContent;
    expect(metaText).toContain('2026');
    expect(metaText).toMatch(/Jan\s+\d+,\s+2026/);
  });
});
