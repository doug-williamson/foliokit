// See docs/recipes/environment-setup.md for setup instructions.
import type { FirebaseOptions } from 'firebase/app';

export interface Environment {
  isProd: boolean;
  useEmulator: boolean;
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
  isProd: false,
  useEmulator: true,
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
    publishableKey: 'pk_test_51THQgWFzZbJgjuvr4Vg1UbryEYrAlpPNb2T8KiXRa3DkQjFxdXBbor1dIleLNRA2ufeg3glthzZm3wOevWEcvzYC00GxvgcJFK',
    proPriceId: 'price_1TL8t7FzZbJgjuvrSyjDcElg',
    agencyPriceId: 'price_1TL8tLFzZbJgjuvrUC3w7g3M',
  },
  cloudFunctionsBaseUrl: 'http://localhost:5001/foliokit-6f974/us-central1',
};
