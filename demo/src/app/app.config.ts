import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  signal,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import { provideFolioKit } from '@foliokit/cms-core';
import { SHELL_CONFIG, type ShellConfig } from '@foliokit/cms-ui';
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
      useValue: signal<ShellConfig>({
        appName: 'Stark Industries Lab Notes',
        showAuth: false,
      }),
    },
  ],
};
