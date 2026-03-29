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
  it('returns root-level path when tenantId is null', () => {
    expect(resolveCollectionPath('posts', null)).toBe('posts');
  });

  it('returns root-level path when tenantId is undefined', () => {
    expect(resolveCollectionPath('posts', undefined)).toBe('posts');
  });

  it('returns root-level path when tenantId is "default"', () => {
    expect(resolveCollectionPath('posts', 'default')).toBe('posts');
  });

  it('returns scoped path when tenantId is a non-default value', () => {
    expect(resolveCollectionPath('posts', 'stark')).toBe('tenants/stark/posts');
  });

  it('works for authors collection', () => {
    expect(resolveCollectionPath('authors', 'stark')).toBe('tenants/stark/authors');
  });

  it('works for tags collection', () => {
    expect(resolveCollectionPath('tags', 'stark')).toBe('tenants/stark/tags');
  });

  it('works for pages collection', () => {
    expect(resolveCollectionPath('pages', 'stark')).toBe('tenants/stark/pages');
  });

  it('returns root-level path for pages when tenantId is null', () => {
    expect(resolveCollectionPath('pages', null)).toBe('pages');
  });
});

describe('resolveSiteConfigDocPath', () => {
  it('returns root-level path for default site', () => {
    expect(resolveSiteConfigDocPath('default', null)).toBe('site-config/default');
  });

  it('returns root-level path when tenantId is "default"', () => {
    expect(resolveSiteConfigDocPath('default', 'default')).toBe('site-config/default');
  });

  it('returns scoped path for multi-tenant site', () => {
    expect(resolveSiteConfigDocPath('stark', 'stark')).toBe('tenants/stark/site-config/stark');
  });
});

describe('resolveStoragePath', () => {
  it('returns unmodified path when tenantId is null', () => {
    expect(resolveStoragePath('posts/abc/cover/img.jpg', null)).toBe('posts/abc/cover/img.jpg');
  });

  it('returns unmodified path when tenantId is "default"', () => {
    expect(resolveStoragePath('posts/abc/cover/img.jpg', 'default')).toBe('posts/abc/cover/img.jpg');
  });

  it('returns scoped path for multi-tenant site', () => {
    expect(resolveStoragePath('posts/abc/cover/img.jpg', 'stark')).toBe('tenants/stark/posts/abc/cover/img.jpg');
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

    it('tenantId is null', () => {
      expect(paths.tenantId).toBeNull();
    });

    it('collection returns root-level path', () => {
      expect(paths.collection('posts')).toBe('posts');
      expect(paths.collection('authors')).toBe('authors');
      expect(paths.collection('tags')).toBe('tags');
      expect(paths.collection('pages')).toBe('pages');
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

    it('tenantId is "stark"', () => {
      expect(paths.tenantId).toBe('stark');
    });

    it('collection returns scoped path', () => {
      expect(paths.collection('posts')).toBe('tenants/stark/posts');
      expect(paths.collection('authors')).toBe('tenants/stark/authors');
      expect(paths.collection('tags')).toBe('tenants/stark/tags');
      expect(paths.collection('pages')).toBe('tenants/stark/pages');
    });

    it('siteConfigDocPath returns scoped path', () => {
      expect(paths.siteConfigDocPath()).toBe('tenants/stark/site-config/stark');
    });

    it('siteConfigDocPath with explicit docId returns scoped path', () => {
      expect(paths.siteConfigDocPath('custom')).toBe('tenants/stark/site-config/custom');
    });

    it('storagePath returns scoped path', () => {
      expect(paths.storagePath('posts/abc/cover/img.jpg')).toBe('tenants/stark/posts/abc/cover/img.jpg');
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

// ── Cross-tenant isolation tests ────────────────────────────────────────────

describe('cross-tenant isolation', () => {
  const collections = ['posts', 'authors', 'tags', 'pages'] as const;

  it('different tenants produce non-overlapping collection paths', () => {
    for (const col of collections) {
      const pathA = resolveCollectionPath(col, 'tenantA');
      const pathB = resolveCollectionPath(col, 'tenantB');
      const rootPath = resolveCollectionPath(col, null);

      expect(pathA).not.toBe(pathB);
      expect(pathA).not.toBe(rootPath);
      expect(pathB).not.toBe(rootPath);
    }
  });

  it('different tenants produce non-overlapping site-config paths', () => {
    const pathA = resolveSiteConfigDocPath('tenantA', 'tenantA');
    const pathB = resolveSiteConfigDocPath('tenantB', 'tenantB');
    const rootPath = resolveSiteConfigDocPath('default', null);

    expect(pathA).not.toBe(pathB);
    expect(pathA).not.toBe(rootPath);
    expect(pathB).not.toBe(rootPath);
  });

  it('different tenants produce non-overlapping storage paths', () => {
    const file = 'posts/abc/cover/img.jpg';
    const pathA = resolveStoragePath(file, 'tenantA');
    const pathB = resolveStoragePath(file, 'tenantB');
    const rootPath = resolveStoragePath(file, null);

    expect(pathA).not.toBe(pathB);
    expect(pathA).not.toBe(rootPath);
    expect(pathB).not.toBe(rootPath);
  });

  it('tenant paths are properly namespaced under tenants/', () => {
    expect(resolveCollectionPath('posts', 'acme')).toBe('tenants/acme/posts');
    expect(resolveStoragePath('img.jpg', 'acme')).toBe('tenants/acme/img.jpg');
    expect(resolveSiteConfigDocPath('acme', 'acme')).toBe('tenants/acme/site-config/acme');
  });
});
