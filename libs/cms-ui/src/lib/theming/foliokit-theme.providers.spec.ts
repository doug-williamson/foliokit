import { TestBed } from '@angular/core/testing';
import { RhombusThemeService } from '@rhombuskit/theme-engine';
import { provideFolioKitTheme } from './foliokit-theme.providers';

const RHOMBUS_KEY = 'rhombuskit:theme-preference';
const LEGACY_KEY = 'folio-theme';

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

describe('provideFolioKitTheme migration shim', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => TestBed.resetTestingModule());

  it('migrates a legacy folio-theme value to the rhombuskit key on first load', () => {
    localStorage.setItem(LEGACY_KEY, 'dark');

    TestBed.configureTestingModule({ providers: [provideFolioKitTheme()] });
    const svc = TestBed.inject(RhombusThemeService);

    // Initializer ran before the service first read storage (plan #9).
    expect(localStorage.getItem(RHOMBUS_KEY)).toBe('dark');
    expect(svc.preference()).toBe('dark');
    expect(svc.current()).toBe('dark');
  });

  it('does not overwrite an existing rhombuskit preference', () => {
    localStorage.setItem(LEGACY_KEY, 'dark');
    localStorage.setItem(RHOMBUS_KEY, 'light');

    TestBed.configureTestingModule({ providers: [provideFolioKitTheme()] });
    const svc = TestBed.inject(RhombusThemeService);

    expect(localStorage.getItem(RHOMBUS_KEY)).toBe('light');
    expect(svc.current()).toBe('light');
  });

  it('falls back to the system default when no legacy value exists', () => {
    TestBed.configureTestingModule({ providers: [provideFolioKitTheme()] });
    const svc = TestBed.inject(RhombusThemeService);

    // No migration written; preference is the configured 'system' default,
    // resolving to 'light' (matchMedia stub reports matches:false).
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
