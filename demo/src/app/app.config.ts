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
        apiKey: 'demo-placeholder',
        authDomain: 'stark-foliokit.firebaseapp.com',
        projectId: 'stark-foliokit',
        storageBucket: 'stark-foliokit.appspot.com',
        messagingSenderId: '000000000000',
        appId: '1:000000000000:web:0000000000000000',
      },
      siteId: 'stark',
    }),
    {
      provide: SHELL_CONFIG,
      useValue: {
        appName: 'Stark Industries Lab Notes',
        showAuth: false,
        nav: [
          { label: 'Home', url: '/', order: 1 },
          { label: 'Lab Notes', url: '/blog', order: 2 },
          { label: 'About', url: '/about', order: 3 },
          { label: 'Links', url: '/links', order: 4 },
        ],
      },
    },
  ],
};
