import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { AppShellComponent } from './app-shell.component';
import { SHELL_CONFIG } from '../shell-config.token';

describe('AppShellComponent hasNav', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (q: string) => ({
        matches: false,
        media: q,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  });

  function render(hasNav: boolean) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: SHELL_CONFIG, useValue: signal({ appName: 'T' }) },
      ],
    });
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('hasNav', hasNav);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the nav drawer when hasNav is true', () => {
    expect(render(true).nativeElement.querySelector('mat-sidenav')).not.toBeNull();
  });

  it('omits the nav drawer when hasNav is false', () => {
    expect(render(false).nativeElement.querySelector('mat-sidenav')).toBeNull();
  });
});
