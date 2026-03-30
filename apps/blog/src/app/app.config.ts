import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { BLOG_SEO_SERVICE, providesFolioKit } from '@foliokit/cms-core';
import { provideCmsUiMatIcons } from '@foliokit/cms-ui';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';
import { BlogSeoService } from './services/blog-seo.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideCmsUiMatIcons(),
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    providesFolioKit({
      firebase: environment.firebase,
      tenantId: 'foliokit',
      features: { markdown: true, auth: false },
      shell: {
        appName: 'FolioKit Blog',
        nav: [
          { label: 'Home', url: '/' },
          { label: 'Posts', url: '/posts' },
        ],
      },
    }),
    { provide: BLOG_SEO_SERVICE, useExisting: BlogSeoService },
  ],
};
