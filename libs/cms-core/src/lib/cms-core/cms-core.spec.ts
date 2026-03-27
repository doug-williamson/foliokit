import { TestBed } from '@angular/core/testing';
import { ADMIN_EMAIL, SITE_ID, provideFolioKit } from '@foliokit/cms-core';

// Minimal Firebase config for testing — no real project needed; these tests
// never establish a network connection.
const testFirebaseConfig = {
  apiKey: 'test-key',
  authDomain: 'test.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:000000000000',
};

describe('cms-core public API smoke tests', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('provideFolioKit() returns a truthy EnvironmentProviders object', () => {
    const result = provideFolioKit({ firebaseConfig: testFirebaseConfig });
    expect(result).toBeTruthy();
  });

  it('ADMIN_EMAIL token is injectable when provided', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ADMIN_EMAIL, useValue: 'admin@example.com' }],
    });
    const email = TestBed.inject(ADMIN_EMAIL);
    expect(email).toBe('admin@example.com');
  });

  it('SITE_ID token is optionally injectable — returns null when absent', () => {
    TestBed.configureTestingModule({ providers: [] });
    const siteId = TestBed.inject(SITE_ID, null);
    expect(siteId).toBeNull();
  });

  it('SITE_ID token is injectable when provided', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SITE_ID, useValue: 'my-site' }],
    });
    const siteId = TestBed.inject(SITE_ID);
    expect(siteId).toBe('my-site');
  });
});
