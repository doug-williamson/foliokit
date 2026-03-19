import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PostEditorComponent } from './post-editor.component';
import { PostEditorStore } from '@foliokit/cms-admin-ui';
import type { BlogPost } from '@foliokit/cms-core';

// ---------------------------------------------------------------------------
// Mock store — uses real Angular signals so template bindings work correctly.
// ---------------------------------------------------------------------------

function makeMockStore(overrides: Partial<{
  post: BlogPost | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  canPublish: boolean;
}> = {}) {
  return {
    post: signal<BlogPost | null>(overrides.post ?? null),
    isDirty: signal(overrides.isDirty ?? false),
    isSaving: signal(overrides.isSaving ?? false),
    saveError: signal<string | null>(overrides.saveError ?? null),
    canPublish: signal(overrides.canPublish ?? false),
    save: vi.fn(),
    publish: vi.fn(),
    initNew: vi.fn(),
    loadPost: vi.fn(),
  };
}

type MockStore = ReturnType<typeof makeMockStore>;

// ---------------------------------------------------------------------------
// Setup helper
// ---------------------------------------------------------------------------

async function setup(storeOverrides?: Parameters<typeof makeMockStore>[0]) {
  const mockStore = makeMockStore(storeOverrides);

  await TestBed.configureTestingModule({
    imports: [PostEditorComponent],
  })
    .overrideComponent(PostEditorComponent, {
      set: {
        // Strip Material imports and add NO_ERRORS_SCHEMA at the component
        // level (required for standalone components — TestBed-level schemas
        // do not apply to standalone component templates).
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [{ provide: PostEditorStore, useValue: mockStore }],
      },
    })
    .compileComponents();

  const fixture: ComponentFixture<PostEditorComponent> =
    TestBed.createComponent(PostEditorComponent);
  fixture.detectChanges();

  return { fixture, mockStore };
}

// ---------------------------------------------------------------------------
// Tab switching
// ---------------------------------------------------------------------------

describe('PostEditorComponent — tab switching', () => {
  it('renders four editing tabs: Content, Media, Metadata, SEO', async () => {
    const { fixture } = await setup();
    const tabs = fixture.debugElement.queryAll(By.css('mat-tab'));
    const labels = tabs
      .map((t) => t.nativeElement.getAttribute('label') as string)
      .filter(Boolean);

    expect(labels).toContain('Content');
    expect(labels).toContain('Media');
    expect(labels).toContain('Metadata');
    expect(labels).toContain('SEO');
  });

  it('has exactly four editing tabs in the left pane', async () => {
    const { fixture } = await setup();
    // Select the first mat-tab-group's mat-tab children
    const tabGroups = fixture.debugElement.queryAll(By.css('mat-tab-group'));
    const leftPaneTabs = tabGroups[0]?.queryAll(By.css('mat-tab')) ?? [];
    expect(leftPaneTabs).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Save button
// ---------------------------------------------------------------------------

describe('PostEditorComponent — Save button', () => {
  function getSaveButton(fixture: ComponentFixture<PostEditorComponent>) {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    return buttons.find(
      (b) => b.nativeElement.textContent.trim() === 'Save',
    );
  }

  it('is disabled when isSaving is true', async () => {
    const { fixture } = await setup({ isSaving: true });
    const btn = getSaveButton(fixture);
    expect(btn).toBeDefined();
    expect(btn!.nativeElement.disabled).toBe(true);
  });

  it('is enabled when isSaving is false', async () => {
    const { fixture } = await setup({ isSaving: false });
    const btn = getSaveButton(fixture);
    expect(btn).toBeDefined();
    expect(btn!.nativeElement.disabled).toBe(false);
  });

  it('calls store.save() on click when enabled', async () => {
    const { fixture, mockStore } = await setup({ isSaving: false });
    const btn = getSaveButton(fixture);
    btn!.nativeElement.click();
    expect(mockStore.save).toHaveBeenCalledTimes(1);
  });

  it('does not call store.save() on click when disabled (isSaving)', async () => {
    const { fixture, mockStore } = await setup({ isSaving: true });
    const btn = getSaveButton(fixture);
    btn!.nativeElement.click();
    expect(mockStore.save).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Publish button
// ---------------------------------------------------------------------------

describe('PostEditorComponent — Publish button', () => {
  function getPublishButton(fixture: ComponentFixture<PostEditorComponent>) {
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    return buttons.find(
      (b) => b.nativeElement.textContent.trim() === 'Publish',
    );
  }

  it('is disabled when canPublish is false', async () => {
    const { fixture } = await setup({ canPublish: false });
    const btn = getPublishButton(fixture);
    expect(btn).toBeDefined();
    expect(btn!.nativeElement.disabled).toBe(true);
  });

  it('is disabled when isSaving is true even if canPublish is true', async () => {
    const { fixture } = await setup({ canPublish: true, isSaving: true });
    const btn = getPublishButton(fixture);
    expect(btn!.nativeElement.disabled).toBe(true);
  });

  it('is enabled when canPublish is true and isSaving is false', async () => {
    const { fixture } = await setup({ canPublish: true, isSaving: false });
    const btn = getPublishButton(fixture);
    expect(btn!.nativeElement.disabled).toBe(false);
  });

  it('calls store.publish() on click when enabled', async () => {
    const { fixture, mockStore } = await setup({ canPublish: true, isSaving: false });
    const btn = getPublishButton(fixture);
    btn!.nativeElement.click();
    expect(mockStore.publish).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Status / dirty state indicator
// ---------------------------------------------------------------------------

describe('PostEditorComponent — status indicators', () => {
  function getToolbarText(fixture: ComponentFixture<PostEditorComponent>) {
    return fixture.debugElement.query(By.css('.border-b'))?.nativeElement
      .textContent as string | undefined;
  }

  it('shows "Saving…" text when isSaving is true', async () => {
    const { fixture } = await setup({ isSaving: true });
    const text = getToolbarText(fixture) ?? '';
    expect(text).toContain('Saving');
  });

  it('shows "Saved" text when isSaving is false, isDirty is false, and post is loaded', async () => {
    const fakePost = {
      id: 'p1',
      title: 'Test',
      slug: '',
      status: 'draft' as const,
      content: '',
      tags: [],
      embeddedMedia: {},
      seo: {},
      publishedAt: { seconds: 0, nanoseconds: 0 },
      updatedAt: { seconds: 0, nanoseconds: 0 },
      createdAt: { seconds: 0, nanoseconds: 0 },
    } as unknown as BlogPost;

    const { fixture } = await setup({
      isSaving: false,
      isDirty: false,
      post: fakePost,
    });

    const text = getToolbarText(fixture) ?? '';
    expect(text).toContain('Saved');
  });

  it('shows a save error message when saveError is set', async () => {
    const { fixture, mockStore } = await setup({ isSaving: false });
    mockStore.saveError.set('Save failed');
    fixture.detectChanges();

    const text = getToolbarText(fixture) ?? '';
    expect(text).toContain('Save failed');
  });

  it('hides the "Saving…" indicator when isSaving is false', async () => {
    const { fixture } = await setup({ isSaving: false });
    const text = getToolbarText(fixture) ?? '';
    expect(text).not.toContain('Saving…');
  });
});
