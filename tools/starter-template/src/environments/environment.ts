import type { FirebaseOptions } from 'firebase/app';

export interface Environment {
  isProd: boolean;
  firebase: FirebaseOptions;
}

// Replace these placeholder values with your Firebase project credentials.
// You can find them in the Firebase console under Project Settings > General.
export const environment: Environment = {
  isProd: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
