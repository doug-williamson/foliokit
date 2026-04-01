import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideFolioKit } from '@foliokit/cms-core';
import { provideAdminKit } from '@foliokit/cms-admin-ui';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideFolioKit({
      firebaseConfig: environment.firebase,
      siteId: 'foliokit',
      useEmulator: environment.useEmulator,
    }),
    provideAdminKit({ adminEmail: environment.adminEmail }),
  ],
};
