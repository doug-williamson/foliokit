import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { App } from './app';
import { FIRESTORE } from '@foliokit/cms-core';

@Component({ standalone: true, template: '', changeDetection: ChangeDetectionStrategy.OnPush })
class BlankComponent {}

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(() =>
    Promise.resolve({ exists: () => false, data: () => undefined }),
  ),
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  orderBy: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
}));

/** Minimal Firestore stub — this smoke test never touches Firestore methods. */
const firestoreStub = {};

describe('App', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: BlankComponent },
          { path: 'not-found', data: { bareShell: true }, component: BlankComponent },
        ]),
        provideNoopAnimations(),
        { provide: FIRESTORE, useValue: firestoreStub },
      ],
    }).compileComponents();
  });

  it('should create', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the nav drawer on standard routes and omits it on bare routes', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigate(['/']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // Standard route: hasNav() true → the shell renders its <mat-sidenav> drawer.
    expect(fixture.nativeElement.querySelector('mat-sidenav')).not.toBeNull();

    await router.navigate(['/not-found']);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    // Bare route (data.bareShell): hasNav() false → the drawer is omitted.
    expect(fixture.nativeElement.querySelector('mat-sidenav')).toBeNull();
  });
});
