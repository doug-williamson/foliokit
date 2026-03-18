import type { FirebaseOptions } from 'firebase/app';
import { FIREBASE_EMULATOR_PROJECT_ID } from '../../../../tools/seed/emulator-config';

export interface Environment {
  isProd: boolean;
  useEmulator: boolean;
  firebase: FirebaseOptions;
}

export const environment: Environment = {
  isProd: false,
  useEmulator: true,
  firebase: {
    // Emulator ignores credentials. Keep projectId shared with seed script.
    apiKey: 'local-dev',
    authDomain: '',
    projectId: FIREBASE_EMULATOR_PROJECT_ID,
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
};
