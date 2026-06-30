import type { FirebaseOptions } from 'firebase/app';

export interface Environment {
  isProd: boolean;
  useEmulator: boolean;
  bypassGating: boolean;
  adminEmail: string;
  firebase: FirebaseOptions;
  stripe: {
    publishableKey: string;
    proPriceId: string;
    agencyPriceId: string;
  };
  cloudFunctionsBaseUrl: string;
}

export const environment: Environment = {
  isProd: true,
  useEmulator: false,
  // Never bypass plan gating in production. Reading import.meta.env here is unsafe:
  // the application builder only substitutes NG_APP_* vars present at build time, and
  // NG_APP_BYPASS_GATING is not set in CI — leaving a raw import.meta.env reference
  // that is undefined at runtime and crashes the app on boot.
  bypassGating: false,
  adminEmail: 'dev.foliokit@gmail.com',
  firebase: {
    apiKey: import.meta.env['NG_APP_FIREBASE_API_KEY'],
    authDomain: import.meta.env['NG_APP_FIREBASE_AUTH_DOMAIN'],
    projectId: import.meta.env['NG_APP_FIREBASE_PROJECT_ID'],
    storageBucket: import.meta.env['NG_APP_FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: import.meta.env['NG_APP_FIREBASE_MESSAGING_SENDER_ID'],
    appId: import.meta.env['NG_APP_FIREBASE_APP_ID'],
  },
  stripe: {
    publishableKey: 'pk_live_51THQgWFzZbJgjuvrLBvDUKsm1wXGLqMeaw8Z7WvjT8U6TNTMoV0UeBtRWzZ955YvVxovadOs08K5JqZi9JZe8UxA00SJdN5kWz',
    proPriceId: 'price_1THQxnFzZbJgjuvrT4HVE0ui',
    agencyPriceId: 'price_1THQyEFzZbJgjuvr328S5y0n',
  },
  cloudFunctionsBaseUrl: 'https://us-central1-foliokit-6f974.cloudfunctions.net',
};
