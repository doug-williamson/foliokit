import { APP_INITIALIZER, ApplicationConfig, inject } from '@angular/core';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { doc, getDoc } from 'firebase/firestore';
import {
  FIREBASE_AUTH,
  FIRESTORE,
  provideFolioKit,
  resolveTenantFromAuth,
  SITE_ID,
  SiteIdRef,
  TenantConfigRef,
} from '@foliokit/cms-core';
import type { TenantConfig } from '@foliokit/cms-core';
import { provideAdminKit } from '@foliokit/cms-admin-ui';
import { appRoutes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    provideFolioKit({
      firebaseConfig: environment.firebase,
      useEmulator: environment.useEmulator,
    }),
    provideAdminKit({ adminEmail: environment.adminEmail }),

    // Late-bind SITE_ID: reads SiteIdRef.value at injection time (after
    // the APP_INITIALIZER below has resolved the tenant from auth).
    { provide: SITE_ID, useFactory: () => inject(SiteIdRef).value },

    // Resolve the tenant from the authenticated user's email at bootstrap.
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const auth = inject(FIREBASE_AUTH);
        const firestore = inject(FIRESTORE);
        const siteIdRef = inject(SiteIdRef);
        const tenantConfigRef = inject(TenantConfigRef);
        const router = inject(Router);

        return async () => {
          if (!auth || !firestore) return;

          try {
            const tenantId = await resolveTenantFromAuth(auth, firestore);
            siteIdRef.value = tenantId;

            // Populate TenantConfigRef so AuthService.isAdmin() works.
            const snap = await getDoc(doc(firestore, 'tenants', tenantId));
            if (snap.exists()) {
              tenantConfigRef.config = {
                tenantId: snap.id,
                ...snap.data(),
              } as TenantConfig;
            }
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : '';
            if (msg === 'unauthenticated') {
              // Let the auth guard handle redirect to /login.
              return;
            }
            if (msg === 'tenant_not_found' || msg === 'tenant_ambiguous') {
              router.navigateByUrl(`/error?code=${msg}`);
              return;
            }
            // Unexpected error — resolve cleanly so the app doesn't hang.
          }
        };
      },
      multi: true,
    },
  ],
};
