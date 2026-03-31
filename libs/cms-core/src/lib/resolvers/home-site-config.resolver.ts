import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { ResolveFn } from '@angular/router';
import { Observable, of } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { SITE_CONFIG_SERVICE } from '../tokens/site-config-service.token';
import type { SiteConfig } from '../models/site-config.model';

const HOME_SITE_CONFIG_KEY = makeStateKey<SiteConfig | null>('blog-home-site-config');

/**
 * Resolves default {@link SiteConfig} for the blog home hero (SSR + browser).
 * Uses {@link TransferState} so hydration does not re-fetch or flash loading UI.
 *
 * `SITE_CONFIG_SERVICE` must be the Admin-backed implementation on the server
 * (`app.config.server.ts`) and the client SDK in the browser.
 */
export function createHomeSiteConfigResolver(): ResolveFn<SiteConfig | null> {
  return (): SiteConfig | null | Observable<SiteConfig | null> => {
    const transferState = inject(TransferState);
    const service = inject(SITE_CONFIG_SERVICE);
    const platformId = inject(PLATFORM_ID);

    if (transferState.hasKey(HOME_SITE_CONFIG_KEY)) {
      const config = transferState.get(HOME_SITE_CONFIG_KEY, null);
      transferState.remove(HOME_SITE_CONFIG_KEY);
      return config;
    }

    return service.getDefaultSiteConfig().pipe(
      take(1),
      tap((config) => {
        if (isPlatformServer(platformId)) {
          transferState.set(HOME_SITE_CONFIG_KEY, config);
        }
      }),
    );
  };
}
