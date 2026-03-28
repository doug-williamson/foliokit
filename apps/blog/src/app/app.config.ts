import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import { BLOG_POST_SERVICE, BLOG_SEO_SERVICE, PostService, SITE_CONFIG_SERVICE, SiteConfigService, provideFirebase } from '@foliokit/cms-core';
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
    provideMarkdown(),
    provideFirebase(environment.firebase, environment.useEmulator),
    { provide: BLOG_POST_SERVICE, useExisting: PostService },
    { provide: SITE_CONFIG_SERVICE, useExisting: SiteConfigService },
    { provide: BLOG_SEO_SERVICE, useExisting: BlogSeoService },
  ],
};
