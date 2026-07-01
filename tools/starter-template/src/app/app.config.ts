// ─────────────────────────────────────────────
// STEP 1: Replace environment.ts Firebase config
// STEP 2: Set siteId to your Firestore site-config document ID
// STEP 3: Update the shell appName in app.component.ts (nav is projected via [shellNav])
// ─────────────────────────────────────────────

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { providesFolioKit } from '@foliokit/cms-core';
import { provideCmsUiRhombusIcons } from '@foliokit/cms-ui';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCmsUiRhombusIcons(),
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    providesFolioKit({
      firebase: environment.firebase,
      siteId: 'YOUR_SITE_ID',
      features: { markdown: true, auth: false },
    }),
  ],
};
