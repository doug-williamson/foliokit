import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ADMIN_EMAIL, FIREBASE_AUTH, FIRESTORE, FIREBASE_STORAGE, BLOG_POST_SERVICE, SITE_CONFIG_SERVICE } from '@foliokit/cms-core';
import { AppShellComponent } from '../app-shell/app-shell.component';
import { SHELL_CONFIG, ShellConfig } from '../shell-config.token';

// Null providers for Firebase root services — prevents NullInjectorError when
// providedIn:'root' services (PostService, SiteConfigService) are instantiated
// by TestBed even though AppShellComponent doesn't depend on them directly.
const firebaseNullProviders = [
  { provide: FIRESTORE, useValue: null },
  { provide: FIREBASE_AUTH, useValue: null },
  { provide: FIREBASE_STORAGE, useValue: null },
  { provide: ADMIN_EMAIL, useValue: 'test@example.com' },
  { provide: BLOG_POST_SERVICE, useValue: null },
  { provide: SITE_CONFIG_SERVICE, useValue: null },
];

const testConfig: ShellConfig = {
  appName: 'Test App',
};

// JSDOM doesn't implement window.matchMedia — stub it so ThemeService
// (providedIn:'root') can initialise without throwing.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      media: '',
      addListener: vi.fn(),    // deprecated but used by Angular CDK BreakpointObserver
      removeListener: vi.fn(), // deprecated but used by Angular CDK BreakpointObserver
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
});

describe('cms-ui public API smoke tests', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('ShellConfig appName is a required string field', () => {
    // Documents the runtime contract; TypeScript enforces it at compile time.
    expect(typeof testConfig.appName).toBe('string');
    expect(testConfig.appName.length).toBeGreaterThan(0);
  });

  it('SHELL_CONFIG token is injectable when provided', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SHELL_CONFIG, useValue: signal(testConfig) }],
    });
    const config = TestBed.inject(SHELL_CONFIG);
    expect(config().appName).toBe('Test App');
  });

  it('AppShellComponent renders when SHELL_CONFIG is provided', async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        { provide: SHELL_CONFIG, useValue: signal(testConfig) },
        provideRouter([]),
        provideAnimationsAsync(),
        ...firebaseNullProviders,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppShellComponent);
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('AppShellComponent renders the appName from SHELL_CONFIG', async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        { provide: SHELL_CONFIG, useValue: signal<ShellConfig>({ appName: 'My Blog' }) },
        provideRouter([]),
        provideAnimationsAsync(),
        ...firebaseNullProviders,
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('My Blog');
  });
});
