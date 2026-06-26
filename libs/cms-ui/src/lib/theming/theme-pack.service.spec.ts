import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { of, throwError } from 'rxjs';
import { ThemePackService } from './theme-pack.service';
import { EDITORIAL_PACK } from './built-in-packs';
import { SiteConfigService } from '@foliokit/cms-core';

// ── Document mock ────────────────────────────────────────────────────────────
const documentSpy = {
  documentElement: {
    style: {
      setProperty: vi.fn(),
      removeProperty: vi.fn(),
      getPropertyValue: vi.fn(() => ''),
    },
  },
  createElement: vi.fn((_tag: string) => ({ rel: '', href: '', textContent: '' })),
  head: { appendChild: vi.fn(), querySelectorAll: vi.fn(() => []) },
};

// ── SiteConfigService mock ───────────────────────────────────────────────────
const mockSiteConfigService = {
  getDefaultSiteConfig: vi.fn(),
  saveSiteConfig: vi.fn(),
};

// ── Helpers ──────────────────────────────────────────────────────────────────
// NOTE: ThemePackService no longer injects RhombusThemeService — colours are CSS-driven
// via [data-theme] since the 1.6.0 palette adoption, so the service is colour-free and
// only owns the pack registry, font loading, and Firestore persistence.
const baseProviders = [
  ThemePackService,
  { provide: DOCUMENT, useValue: documentSpy },
  { provide: PLATFORM_ID, useValue: 'browser' },
  { provide: SiteConfigService, useValue: mockSiteConfigService },
];

function createService(): ThemePackService {
  return TestBed.inject(ThemePackService);
}

describe('ThemePackService', () => {
  let service: ThemePackService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: getDefaultSiteConfig returns null (no saved pack)
    mockSiteConfigService.getDefaultSiteConfig.mockReturnValue(of(null));
    mockSiteConfigService.saveSiteConfig.mockReturnValue(of({}));
  });

  afterEach(() => TestBed.resetTestingModule());

  // ── Test 1: Defaults to editorial pack ──────────────────────────────────────
  it('defaults activePack to editorial when no FOLIOKIT_THEME_PACKS provided', () => {
    TestBed.configureTestingModule({ providers: baseProviders });

    service = createService();

    expect(service.activePack().id).toBe('editorial');
  });

  // ── Test 2: Colours are CSS-driven — the service must not write them inline ──
  it('does not write colour tokens to documentElement.style', () => {
    TestBed.configureTestingModule({ providers: baseProviders });

    service = createService();
    vi.clearAllMocks(); // clear constructor calls

    service.setPack(EDITORIAL_PACK, { persist: false });

    // Inline colour application would override the [data-theme] palette CSS by specificity.
    expect(documentSpy.documentElement.style.setProperty).not.toHaveBeenCalled();
  });

  // ── Test 3: setPackById with unknown id is a no-op + warns ─────────────────
  it('setPackById warns and does not change activePack for unknown id', () => {
    TestBed.configureTestingModule({ providers: baseProviders });

    service = createService();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    service.setPackById('does-not-exist');

    expect(warnSpy).toHaveBeenCalled();
    expect(service.activePack().id).toBe('editorial');
  });

  // ── Test 4: SiteConfig persistence is called on setPack ─────────────────────
  it('calls saveSiteConfig with themePackId when setPack is called', () => {
    mockSiteConfigService.getDefaultSiteConfig.mockReturnValue(
      of({ id: 'default', siteName: 'Test', siteUrl: 'http://test.com', updatedAt: 0 }),
    );
    mockSiteConfigService.saveSiteConfig.mockReturnValue(of({}));

    TestBed.configureTestingModule({ providers: baseProviders });

    service = createService();

    service.setPack(EDITORIAL_PACK);

    expect(mockSiteConfigService.saveSiteConfig).toHaveBeenCalledWith(
      expect.objectContaining({ themePackId: 'editorial' }),
    );
  });

  // ── Test 5: SiteConfig persistence errors are caught ────────────────────────
  it('does not throw when saveSiteConfig errors, and logs to console.error', () => {
    mockSiteConfigService.getDefaultSiteConfig.mockReturnValue(
      of({ id: 'default', siteName: 'Test', siteUrl: 'http://test.com', updatedAt: 0 }),
    );
    mockSiteConfigService.saveSiteConfig.mockReturnValue(
      throwError(() => new Error('network error')),
    );

    TestBed.configureTestingModule({ providers: baseProviders });

    service = createService();

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => service.setPack(EDITORIAL_PACK)).not.toThrow();
    expect(mockSiteConfigService.saveSiteConfig).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
