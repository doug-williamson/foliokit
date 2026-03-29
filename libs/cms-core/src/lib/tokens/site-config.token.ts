import { InjectionToken } from '@angular/core';
import type { SiteConfig } from '../models/site-config.model';

/**
 * Injection token holding the eagerly-loaded {@link SiteConfig} value.
 *
 * Populated by the `APP_INITIALIZER` registered inside {@link providesFolioKit}.
 * On the server side (SSR) the value may be `null` because the client Firestore
 * SDK is not available — server consumers should provide `SITE_CONFIG` directly
 * or use the `SITE_CONFIG_SERVICE` observable API instead.
 */
export const SITE_CONFIG = new InjectionToken<SiteConfig | null>('SITE_CONFIG');
