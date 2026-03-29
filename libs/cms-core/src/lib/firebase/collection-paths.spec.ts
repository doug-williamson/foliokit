import { TestBed } from '@angular/core/testing';
import { SITE_ID } from './foliokit.providers';
import {
  CollectionPaths,
  resolveCollectionPath,
  resolveSiteConfigDocPath,
  resolveStoragePath,
} from './collection-paths';

// ── Pure function tests ─────────────────────────────────────────────────────

describe('resolveCollectionPath', () => {
  it('returns root-level path when siteId is null', () => {
    expect(resolveCollectionPath('posts', null)).toBe('posts');
  });

  it('returns root-level path when siteId is undefined', () => {
    expect(resolveCollectionPath('posts', undefined)).toBe('posts');
  });

  it('returns root-level path when siteId is "default"', () => {
    expect(resolveCollectionPath('posts', 'default')).toBe('posts');
  });

  it('returns scoped path when siteId is a non-default value', () => {
    expect(resolveCollectionPath('posts', 'stark')).toBe('sites/stark/posts');
  });

  it('works for authors collection', () => {
    expect(resolveCollectionPath('authors', 'stark')).toBe('sites/stark/authors');
  });

  it('works for tags collection', () => {
    expect(resolveCollectionPath('tags', 'stark')).toBe('sites/stark/tags');
  });
});

describe('resolveSiteConfigDocPath', () => {
  it('returns root-level path for default site', () => {
    expect(resolveSiteConfigDocPath('default', null)).toBe('site-config/default');
  });

  it('returns root-level path when siteId is "default"', () => {
    expect(resolveSiteConfigDocPath('default', 'default')).toBe('site-config/default');
  });

  it('returns scoped path for multi-tenant site', () => {
    expect(resolveSiteConfigDocPath('stark', 'stark')).toBe('sites/stark/site-config/stark');
  });
});

describe('resolveStoragePath', () => {
  it('returns unmodified path when siteId is null', () => {
    expect(resolveStoragePath('posts/abc/cover/img.jpg', null)).toBe('posts/abc/cover/img.jpg');
  });

  it('returns unmodified path when siteId is "default"', () => {
    expect(resolveStoragePath('posts/abc/cover/img.jpg', 'default')).toBe('posts/abc/cover/img.jpg');
  });

  it('returns scoped path for multi-tenant site', () => {
    expect(resolveStoragePath('posts/abc/cover/img.jpg', 'stark')).toBe('sites/stark/posts/abc/cover/img.jpg');
  });
});

// ── Injectable service tests ────────────────────────────────────────────────

describe('CollectionPaths (injectable)', () => {
  afterEach(() => TestBed.resetTestingModule());

  describe('without SITE_ID', () => {
    let paths: CollectionPaths;

    beforeEach(() => {
      TestBed.configureTestingModule({});
      paths = TestBed.inject(CollectionPaths);
    });

    it('siteId is null', () => {
      expect(paths.siteId).toBeNull();
    });

    it('collection returns root-level path', () => {
      expect(paths.collection('posts')).toBe('posts');
      expect(paths.collection('authors')).toBe('authors');
      expect(paths.collection('tags')).toBe('tags');
    });

    it('siteConfigDocPath returns root-level path', () => {
      expect(paths.siteConfigDocPath()).toBe('site-config/default');
    });

    it('storagePath returns unmodified path', () => {
      expect(paths.storagePath('posts/abc/cover/img.jpg')).toBe('posts/abc/cover/img.jpg');
    });
  });

  describe('with SITE_ID = "stark"', () => {
    let paths: CollectionPaths;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: SITE_ID, useValue: 'stark' }],
      });
      paths = TestBed.inject(CollectionPaths);
    });

    it('siteId is "stark"', () => {
      expect(paths.siteId).toBe('stark');
    });

    it('collection returns scoped path', () => {
      expect(paths.collection('posts')).toBe('sites/stark/posts');
      expect(paths.collection('authors')).toBe('sites/stark/authors');
      expect(paths.collection('tags')).toBe('sites/stark/tags');
    });

    it('siteConfigDocPath returns scoped path', () => {
      expect(paths.siteConfigDocPath()).toBe('sites/stark/site-config/stark');
    });

    it('siteConfigDocPath with explicit docId returns scoped path', () => {
      expect(paths.siteConfigDocPath('custom')).toBe('sites/stark/site-config/custom');
    });

    it('storagePath returns scoped path', () => {
      expect(paths.storagePath('posts/abc/cover/img.jpg')).toBe('sites/stark/posts/abc/cover/img.jpg');
    });
  });

  describe('with SITE_ID = "default"', () => {
    let paths: CollectionPaths;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [{ provide: SITE_ID, useValue: 'default' }],
      });
      paths = TestBed.inject(CollectionPaths);
    });

    it('collection returns root-level path (default treated as single-tenant)', () => {
      expect(paths.collection('posts')).toBe('posts');
    });

    it('storagePath returns unmodified path', () => {
      expect(paths.storagePath('authors/abc/photo/img.jpg')).toBe('authors/abc/photo/img.jpg');
    });
  });
});
