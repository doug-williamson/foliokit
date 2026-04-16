import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideFolioKit } from '@foliokit/cms-core';
import { provideAdminKit } from '@foliokit/cms-admin-ui';
import { provideThemePacks } from '@foliokit/cms-ui';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(withFetch()),
    provideFolioKit({
      firebaseConfig: environment.firebase,
      siteId: 'foliokitcms',
      useEmulator: environment.useEmulator,
    }),
    provideAdminKit({
      adminEmail: environment.adminEmail,
      cloudFunctionsBaseUrl: environment.cloudFunctionsBaseUrl,
    }),
    provideThemePacks(),
  ],
};
