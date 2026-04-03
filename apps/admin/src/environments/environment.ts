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
    publishableKey: 'pk_live_51THQgWFzZbJgjuvrLBvDUKsm1wXGLqMeaw8Z7WvjT8U6TNTMoV0UeBtRWzZ955YvVxovadOs08K5JqZi9JZe8UxA00SJdN5kWz',
    proPriceId: 'price_1THQxnFzZbJgjuvrT4HVE0ui',
    agencyPriceId: 'price_1THQyEFzZbJgjuvr328S5y0n',
  },
  cloudFunctionsBaseUrl: 'http://localhost:5001/foliokit-6f974/us-central1',
};
