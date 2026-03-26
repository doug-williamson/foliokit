import {
  EnvironmentProviders,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseOptions, getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  FIREBASE_APP,
  FIREBASE_AUTH,
  FIREBASE_OPTIONS,
  FIREBASE_STORAGE,
  FIRESTORE,
} from './firebase.config';

export function provideFirebase(
  options: FirebaseOptions,
  useEmulator = false
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_OPTIONS,
      useValue: options,
    },
    {
      // Firebase app is a Node.js-process-level singleton. In SSR, each request
      // creates a new DI context but shares the same global Firebase registry, so
      // we must reuse the existing app rather than calling initializeApp again.
      provide: FIREBASE_APP,
      useFactory: () =>
        getApps().length ? getApp() : initializeApp(inject(FIREBASE_OPTIONS)),
    },
    {
      // Same singleton constraint applies to the Firestore instance.
      // initializeFirestore throws if called a second time for the same app, so
      // fall back to getFirestore() which returns the already-configured instance.
      // Client SDK must not run on the server — Admin SDK handles SSR reads.
      provide: FIRESTORE,
      useFactory: () => {
        const platformId = inject(PLATFORM_ID);
        if (!isPlatformBrowser(platformId)) return null;
        const app = inject(FIREBASE_APP);
        try {
          const db = initializeFirestore(app, { localCache: memoryLocalCache(), ignoreUndefinedProperties: true });
          if (useEmulator) {
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
          }
          return db;
        } catch {
          return getFirestore(app);
        }
      },
    },
    {
      provide: FIREBASE_STORAGE,
      useFactory: () => {
        const platformId = inject(PLATFORM_ID);
        if (!isPlatformBrowser(platformId)) return null;
        const storage = getStorage(inject(FIREBASE_APP));
        if (useEmulator) {
          connectStorageEmulator(storage, '127.0.0.1', 9199);
        }
        return storage;
      },
    },
    {
      // Auth relies on browser APIs (IndexedDB, localStorage) — null on server
      provide: FIREBASE_AUTH,
      useFactory: () => {
        const platformId = inject(PLATFORM_ID);
        if (!isPlatformBrowser(platformId)) return null;
        const auth = getAuth(inject(FIREBASE_APP));
        if (useEmulator) {
          connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        }
        return auth;
      },
    },
  ]);
}
