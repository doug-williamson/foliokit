import {
  EnvironmentProviders,
  PLATFORM_ID,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseOptions, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import {
  FIREBASE_APP,
  FIREBASE_AUTH,
  FIREBASE_OPTIONS,
  FIREBASE_STORAGE,
  FIRESTORE,
} from './firebase.config';

export function provideFirebase(options: FirebaseOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: FIREBASE_OPTIONS,
      useValue: options,
    },
    {
      provide: FIREBASE_APP,
      useFactory: () => initializeApp(inject(FIREBASE_OPTIONS)),
    },
    {
      provide: FIRESTORE,
      useFactory: () => getFirestore(inject(FIREBASE_APP)),
    },
    {
      provide: FIREBASE_STORAGE,
      useFactory: () => getStorage(inject(FIREBASE_APP)),
    },
    {
      // Auth relies on browser APIs (IndexedDB, localStorage) — null on server
      provide: FIREBASE_AUTH,
      useFactory: () => {
        const platformId = inject(PLATFORM_ID);
        return isPlatformBrowser(platformId) ? getAuth(inject(FIREBASE_APP)) : null;
      },
    },
  ]);
}
