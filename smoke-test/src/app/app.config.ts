import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import { provideFolioKit } from '@foliokit/cms-core';
import { SHELL_CONFIG } from '@foliokit/cms-ui';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideMarkdown(),
    provideFolioKit({
      firebaseConfig: {
        apiKey: 'smoke-test-placeholder',
        authDomain: 'smoke-test.firebaseapp.com',
        projectId: 'smoke-test',
        storageBucket: 'smoke-test.appspot.com',
        messagingSenderId: '000000000000',
        appId: '1:000000000000:web:0000000000000000000000',
      },
      siteId: 'smoke-test',
    }),
    {
      provide: SHELL_CONFIG,
      useValue: {
        appName: 'FolioKit Smoke Test',
        showAuth: false,
        nav: [],
      },
    },
  ],
};
