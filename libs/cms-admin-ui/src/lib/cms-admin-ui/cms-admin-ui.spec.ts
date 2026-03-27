import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ADMIN_EMAIL, FIREBASE_AUTH } from '@foliokit/cms-core';
import { AdminLoginComponent, provideAdminKit } from '@foliokit/cms-admin-ui';

describe('cms-admin-ui public API smoke tests', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('provideAdminKit() returns a truthy EnvironmentProviders object', () => {
    // markdown: false avoids pulling in provideMarkdown() in a unit test context
    const result = provideAdminKit({ adminEmail: 'admin@example.com', markdown: false });
    expect(result).toBeTruthy();
  });

  it('AdminLoginComponent renders with a sign-in button', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent],
      providers: [
        // FIREBASE_AUTH is null → no real Firebase calls in tests
        { provide: FIREBASE_AUTH, useValue: null },
        { provide: ADMIN_EMAIL, useValue: 'admin@example.com' },
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminLoginComponent);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement | null;
    expect(button).toBeTruthy();
    expect(button?.textContent).toContain('Sign in');
  });

  it('AdminLoginComponent shows no error message initially', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent],
      providers: [
        { provide: FIREBASE_AUTH, useValue: null },
        { provide: ADMIN_EMAIL, useValue: 'admin@example.com' },
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminLoginComponent);
    fixture.detectChanges();

    // Error paragraph is only rendered when the error signal has a value
    const errorEl = fixture.nativeElement.querySelector('p.text-red-600') as HTMLElement | null;
    expect(errorEl).toBeNull();
  });

  it('AdminLoginComponent accepts appName and redirectTo inputs', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent],
      providers: [
        { provide: FIREBASE_AUTH, useValue: null },
        { provide: ADMIN_EMAIL, useValue: 'admin@example.com' },
        provideRouter([]),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminLoginComponent);
    fixture.componentRef.setInput('appName', 'My CMS');
    fixture.componentRef.setInput('redirectTo', '/dashboard');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('My CMS');
  });
});
