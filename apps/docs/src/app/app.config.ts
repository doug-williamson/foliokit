import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { DOCS_ROUTE_MANIFEST } from '@foliokit/docs-ui';
import { appRoutes } from './app.routes';
import { DOCS_MANIFEST } from './docs-route-manifest';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    { provide: DOCS_ROUTE_MANIFEST, useValue: DOCS_MANIFEST },
  ],
};
