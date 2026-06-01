import { TestBed } from '@angular/core/testing';
import { RhombusThemeService } from '@rhombuskit/theme-engine';
import { provideFolioKitTheme } from './foliokit-theme.providers';

const RHOMBUS_KEY = 'rhombuskit:theme-preference';

// RhombusThemeService.subscribeToSystemTheme() calls window.matchMedia on
// construction; JSDOM doesn't implement it.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      media: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

// Legacy folio-theme migration is handled pre-paint by FOLIOKIT_THEME_INIT_SCRIPT
// (see theme-init-script.spec.ts), not by this provider.
describe('provideFolioKitTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => TestBed.resetTestingModule());

  it('configures RhombusThemeService with the system default and FolioKit theme names', () => {
    TestBed.configureTestingModule({ providers: [provideFolioKitTheme()] });
    const svc = TestBed.inject(RhombusThemeService);

    // No persisted preference; default 'system' resolves to 'light'
    // (matchMedia stub reports matches:false).
    expect(localStorage.getItem(RHOMBUS_KEY)).toBeNull();
    expect(svc.preference()).toBe('system');
    expect(svc.current()).toBe('light');
  });

  it('keeps the two-state setTheme contract writing data-theme="light"|"dark"', () => {
    TestBed.configureTestingModule({ providers: [provideFolioKitTheme()] });
    const svc = TestBed.inject(RhombusThemeService);

    svc.setTheme('dark');
    TestBed.flushEffects();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    svc.setTheme('light');
    TestBed.flushEffects();
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
