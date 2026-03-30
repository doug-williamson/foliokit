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

/**
 * Default tenant ID used as the static fallback. In production, the SSR
 * server resolves the actual tenant from the hostname and overrides
 * SITE_ID in app.config.server.ts. On the client, this value is used
 * unless the server's TransferState provides a different one.
 */
const DEFAULT_TENANT_ID = 'foliokit';

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
      tenantId: DEFAULT_TENANT_ID,
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
