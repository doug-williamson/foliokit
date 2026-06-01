import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  AUTHOR_SERVICE,
  AuthorService,
  provideDefaultBlogSeo,
  providesFolioKit,
} from '@foliokit/cms-core';
import { provideCmsUiMatIcons, provideFolioKitTheme } from '@foliokit/cms-ui';
import { environment } from '../environments/environment';
import { BLOG_STATIC_SITE_ID } from './blog-app-tenant';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCmsUiMatIcons(),
    provideFolioKitTheme(),
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    providesFolioKit({
      firebase: environment.firebase,
      tenantId: BLOG_STATIC_SITE_ID,
      useEmulator: environment.useEmulator,
      features: { markdown: true, auth: false },
      shell: {
        appName: 'FolioKit Blog',
      },
    }),
    provideDefaultBlogSeo(),
    { provide: AUTHOR_SERVICE, useExisting: AuthorService },
  ],
};
