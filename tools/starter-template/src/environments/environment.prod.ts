import type { FirebaseOptions } from 'firebase/app';

export interface Environment {
  isProd: boolean;
  firebase: FirebaseOptions;
}

// Production environment — values injected at build time via @ngx-env/builder.
// Set NG_APP_FIREBASE_* environment variables in your CI/CD pipeline,
// or replace the import.meta.env references with hardcoded values.
export const environment: Environment = {
  isProd: true,
  firebase: {
    apiKey: import.meta.env['NG_APP_FIREBASE_API_KEY'],
    authDomain: import.meta.env['NG_APP_FIREBASE_AUTH_DOMAIN'],
    projectId: import.meta.env['NG_APP_FIREBASE_PROJECT_ID'],
    storageBucket: import.meta.env['NG_APP_FIREBASE_STORAGE_BUCKET'],
    messagingSenderId: import.meta.env['NG_APP_FIREBASE_MESSAGING_SENDER_ID'],
    appId: import.meta.env['NG_APP_FIREBASE_APP_ID'],
  },
};
