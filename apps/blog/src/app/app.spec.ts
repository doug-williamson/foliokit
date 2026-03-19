import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { App } from './app';
import { FIRESTORE } from '@foliokit/cms-core';
import { firestoreStub } from '../../../../libs/cms-core/testing/firestore.stub';

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
        provideRouter([]),
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
});
