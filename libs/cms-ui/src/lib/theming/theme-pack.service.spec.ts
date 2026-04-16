import { signal, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { of, throwError } from 'rxjs';
import { ThemePackService } from './theme-pack.service';
import { FOLIOKIT_THEME_PACKS } from './theme-pack.tokens';
import { EDITORIAL_PACK } from './built-in-packs';
import { MOCK_DEV_PACK } from './built-in-packs/_dev-fixtures/mock.pack';
import { ThemeService } from '../theme.service';
import { SiteConfigService } from '@foliokit/cms-core';

// ── Document mock ────────────────────────────────────────────────────────────
const mockStyle: Record<string, string> = {};
const documentSpy = {
  documentElement: {
    style: {
      setProperty: vi.fn((key: string, value: string) => {
        mockStyle[key] = value;
      }),
      removeProperty: vi.fn((key: string) => {
        delete mockStyle[key];
      }),
      getPropertyValue: vi.fn((key: string) => mockStyle[key] ?? ''),
    },
  },
  createElement: vi.fn((_tag: string) => ({ rel: '', href: '', textContent: '' })),
  head: { appendChild: vi.fn(), querySelectorAll: vi.fn(() => []) },
};

// ── ThemeService mock ────────────────────────────────────────────────────────
const schemeSignal = signal<'light' | 'dark'>('light');
const mockThemeService = { scheme: schemeSignal };

// ── SiteConfigService mock ───────────────────────────────────────────────────
const mockSiteConfigService = {
  getDefaultSiteConfig: vi.fn(),
  saveSiteConfig: vi.fn(),
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const baseProviders = [
  ThemePackService,
  { provide: DOCUMENT, useValue: documentSpy },
  { provide: PLATFORM_ID, useValue: 'browser' },
  { provide: ThemeService, useValue: mockThemeService },
  { provide: SiteConfigService, useValue: mockSiteConfigService },
];

function createService(): ThemePackService {
  return TestBed.inject(ThemePackService);
}

describe('ThemePackService', () => {
  let service: ThemePackService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockStyle between tests
    for (const key of Object.keys(mockStyle)) {
      delete mockStyle[key];
    }
    // Reset scheme to light
    schemeSignal.set('light');

    // Default: getDefaultSiteConfig returns null (no saved pack)
    mockSiteConfigService.getDefaultSiteConfig.mockReturnValue(of(null));
    mockSiteConfigService.saveSiteConfig.mockReturnValue(of({}));
  });

  afterEach(() => TestBed.resetTestingModule());

  // ── Test 1: Defaults to editorial pack ──────────────────────────────────────
  it('defaults activePack to editorial when no FOLIOKIT_THEME_PACKS provided', () => {
    TestBed.configureTestingModule({
      providers: baseProviders,
    });

    service = createService();

    expect(service.activePack().id).toBe('editorial');
  });

  // ── Test 2: setPack writes inline styles to documentElement ─────────────────
  it('setPack writes CSS custom properties to documentElement.style', () => {
    TestBed.configureTestingModule({
      providers: baseProviders,
    });

    service = createService();
    vi.clearAllMocks(); // clear calls from constructor

    service.setPack(EDITORIAL_PACK);

    expect(documentSpy.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--bg',
      '#F8FAFD',
    );
  });

  // ── Test 3: setPack clears previously-applied properties ────────────────────
  it('setPack removes previous pack tokens before applying new ones', () => {
    TestBed.configureTestingModule({
      providers: [
        ...baseProviders,
        { provide: FOLIOKIT_THEME_PACKS, useValue: [MOCK_DEV_PACK], multi: true },
      ],
    });

    service = createService();

    // Apply the mock pack first (it has '--bg': '#FF00FF')
    service.setPack(MOCK_DEV_PACK);

    vi.clearAllMocks();

    // Now apply editorial — mock pack keys should be removed
    service.setPack(EDITORIAL_PACK);

    expect(documentSpy.documentElement.style.removeProperty).toHaveBeenCalledWith('--bg');
  });

  // ── Test 4: Mode change re-applies tokens with correct values ───────────────
  it('re-applies tokens with dark-mode values when scheme changes to dark', () => {
    TestBed.configureTestingModule({
      providers: baseProviders,
    });

    service = createService();

    vi.clearAllMocks(); // clear constructor calls

    // Trigger dark mode and flush Angular effects
    schemeSignal.set('dark');
    TestBed.flushEffects();

    expect(documentSpy.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--bg',
      '#1A1F2E',
    );
  });

  // ── Test 5: setPackById with unknown id is a no-op + warns ─────────────────
  it('setPackById warns and does not change activePack for unknown id', () => {
    TestBed.configureTestingModule({
      providers: baseProviders,
    });

    service = createService();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    service.setPackById('does-not-exist');

    expect(warnSpy).toHaveBeenCalled();
    expect(service.activePack().id).toBe('editorial');
  });

  // ── Test 6: SiteConfig persistence is called on setPack ─────────────────────
  it('calls saveSiteConfig with themePackId when setPack is called', () => {
    mockSiteConfigService.getDefaultSiteConfig.mockReturnValue(
      of({
        id: 'default',
        siteName: 'Test',
        siteUrl: 'http://test.com',
        updatedAt: 0,
      }),
    );
    mockSiteConfigService.saveSiteConfig.mockReturnValue(of({}));

    TestBed.configureTestingModule({
      providers: baseProviders,
    });

    service = createService();

    service.setPack(EDITORIAL_PACK);

    expect(mockSiteConfigService.saveSiteConfig).toHaveBeenCalledWith(
      expect.objectContaining({ themePackId: 'editorial' }),
    );
  });

  // ── Test 7: SiteConfig persistence errors are caught ────────────────────────
  it('does not throw when saveSiteConfig errors, and logs to console.error', () => {
    mockSiteConfigService.getDefaultSiteConfig.mockReturnValue(
      of({
        id: 'default',
        siteName: 'Test',
        siteUrl: 'http://test.com',
        updatedAt: 0,
      }),
    );
    mockSiteConfigService.saveSiteConfig.mockReturnValue(
      throwError(() => new Error('network error')),
    );

    TestBed.configureTestingModule({
      providers: baseProviders,
    });

    service = createService();

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => service.setPack(EDITORIAL_PACK)).not.toThrow();
    expect(mockSiteConfigService.saveSiteConfig).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });
});
