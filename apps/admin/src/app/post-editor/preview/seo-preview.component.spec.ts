import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PostEditorStore } from '@foliokit/cms-admin-ui';
import type { BlogPost } from '@foliokit/cms-core';
import { SeoPreviewComponent } from './seo-preview.component';

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
    imports: [SeoPreviewComponent],
    providers: [
      { provide: PostEditorStore, useValue: { post: postSignal } },
    ],
  });

  const fixture: ComponentFixture<SeoPreviewComponent> =
    TestBed.createComponent(SeoPreviewComponent);
  fixture.detectChanges();

  return { fixture, postSignal };
}

// ---------------------------------------------------------------------------
// URL line
// ---------------------------------------------------------------------------

describe('SeoPreviewComponent — URL line', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders the full URL with the post slug', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ slug: 'my-great-post' }));
    fixture.detectChanges();

    const urlEl = fixture.debugElement.query(By.css('.snippet-url'));
    expect(urlEl.nativeElement.textContent.trim()).toBe(
      'https://yoursite.com/blog/my-great-post',
    );
  });

  it('falls back to "your-post-slug" when slug is empty', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ slug: '' }));
    fixture.detectChanges();

    const urlEl = fixture.debugElement.query(By.css('.snippet-url'));
    expect(urlEl.nativeElement.textContent.trim()).toBe(
      'https://yoursite.com/blog/your-post-slug',
    );
  });
});

// ---------------------------------------------------------------------------
// Title fallback chain
// ---------------------------------------------------------------------------

describe('SeoPreviewComponent — title fallback', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders seo.title when present', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ title: 'Post Title', seo: { title: 'SEO Title' } }));
    fixture.detectChanges();

    const titleEl = fixture.debugElement.query(By.css('a.snippet-title'));
    expect(titleEl.nativeElement.textContent.trim()).toBe('SEO Title');
  });

  it('falls back to post.title when seo.title is absent', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ title: 'Post Title', seo: {} }));
    fixture.detectChanges();

    const titleEl = fixture.debugElement.query(By.css('a.snippet-title'));
    expect(titleEl.nativeElement.textContent.trim()).toBe('Post Title');
  });

  it('falls back to "Post title" when both seo.title and post.title are empty', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ title: '', seo: {} }));
    fixture.detectChanges();

    const titleEl = fixture.debugElement.query(By.css('a.snippet-title'));
    expect(titleEl.nativeElement.textContent.trim()).toBe('Post title');
  });
});

// ---------------------------------------------------------------------------
// Description fallback chain
// ---------------------------------------------------------------------------

describe('SeoPreviewComponent — description fallback', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders seo.description when present', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(
      makePost({ excerpt: 'Excerpt text', seo: { description: 'SEO desc' } }),
    );
    fixture.detectChanges();

    const descEl = fixture.debugElement.query(By.css('p.snippet-description'));
    expect(descEl.nativeElement.textContent.trim()).toBe('SEO desc');
  });

  it('falls back to post.excerpt when seo.description is absent', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ excerpt: 'Excerpt text', seo: {} }));
    fixture.detectChanges();

    const descEl = fixture.debugElement.query(By.css('p.snippet-description'));
    expect(descEl.nativeElement.textContent.trim()).toBe('Excerpt text');
  });

  it('falls back to placeholder string when both seo.description and excerpt are absent', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ excerpt: '', seo: {} }));
    fixture.detectChanges();

    const descEl = fixture.debugElement.query(By.css('p.snippet-description'));
    expect(descEl.nativeElement.textContent.trim()).toContain(
      'No description provided.',
    );
  });
});

// ---------------------------------------------------------------------------
// Character count — title
// ---------------------------------------------------------------------------

describe('SeoPreviewComponent — title character count', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('does NOT apply text-red-500 when title length is within 60 chars', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ title: 'Short title', seo: {} }));
    fixture.detectChanges();

    const spans = fixture.debugElement
      .queryAll(By.css('span'))
      .filter((el) => (el.nativeElement.textContent as string).includes('Title:'));
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].nativeElement.classList.contains('text-red-500')).toBeFalse();
  });

  it('applies text-red-500 when title length exceeds 60 chars', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ title: 'A'.repeat(61), seo: {} }));
    fixture.detectChanges();

    const spans = fixture.debugElement
      .queryAll(By.css('span'))
      .filter((el) => (el.nativeElement.textContent as string).includes('Title:'));
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].nativeElement.classList.contains('text-red-500')).toBeTrue();
  });
});

// ---------------------------------------------------------------------------
// Character count — description
// ---------------------------------------------------------------------------

describe('SeoPreviewComponent — description character count', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('does NOT apply text-red-500 when description length is within 160 chars', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ excerpt: 'Short desc', seo: {} }));
    fixture.detectChanges();

    const spans = fixture.debugElement
      .queryAll(By.css('span'))
      .filter((el) => (el.nativeElement.textContent as string).includes('Description:'));
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].nativeElement.classList.contains('text-red-500')).toBeFalse();
  });

  it('applies text-red-500 when description length exceeds 160 chars', () => {
    const { fixture, postSignal } = setup();
    postSignal.set(makePost({ excerpt: 'A'.repeat(161), seo: {} }));
    fixture.detectChanges();

    const spans = fixture.debugElement
      .queryAll(By.css('span'))
      .filter((el) => (el.nativeElement.textContent as string).includes('Description:'));
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0].nativeElement.classList.contains('text-red-500')).toBeTrue();
  });
});

// ---------------------------------------------------------------------------
// Null post
// ---------------------------------------------------------------------------

describe('SeoPreviewComponent — null post', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders "No post loaded." when post() returns null', () => {
    const { fixture } = setup();
    // postSignal starts as null; detectChanges already called in setup()

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('No post loaded.');
    expect(fixture.debugElement.query(By.css('.snippet'))).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Reactivity
// ---------------------------------------------------------------------------

describe('SeoPreviewComponent — reactivity', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('updates the DOM when postSignal is updated and detectChanges() is called', () => {
    const { fixture, postSignal } = setup();

    postSignal.set(makePost({ slug: 'first-slug' }));
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.snippet-url')).nativeElement.textContent,
    ).toContain('first-slug');

    postSignal.set(makePost({ slug: 'updated-slug' }));
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('.snippet-url')).nativeElement.textContent,
    ).toContain('updated-slug');
  });

  it('transitions from null to a post and back to null correctly', () => {
    const { fixture, postSignal } = setup();

    expect(fixture.debugElement.query(By.css('.snippet'))).toBeNull();

    postSignal.set(makePost({ slug: 'a-post' }));
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.snippet'))).not.toBeNull();

    postSignal.set(null);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.snippet'))).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No post loaded.');
  });
});
