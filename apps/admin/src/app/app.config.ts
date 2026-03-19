import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideMarkdown } from 'ngx-markdown';
import { ADMIN_EMAIL, provideFirebase } from '@foliokit/cms-core';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withComponentInputBinding()),
    provideFirebase(environment.firebase, environment.useEmulator),
    { provide: ADMIN_EMAIL, useValue: environment.adminEmail },
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideMarkdown(),
    provideNativeDateAdapter(),
  ],
};
