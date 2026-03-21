import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';
import { BLOG_PAGE_SERVICE, BLOG_POST_SERVICE, provideFirebase } from '@foliokit/cms-core';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';
import { ClientBlogPostService } from './services/client-post.service';
import { ClientPageService } from './services/client-page.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideMarkdown(),
    provideFirebase(environment.firebase, environment.useEmulator),
    { provide: BLOG_POST_SERVICE, useClass: ClientBlogPostService },
    { provide: BLOG_PAGE_SERVICE, useClass: ClientPageService },
  ],
};
