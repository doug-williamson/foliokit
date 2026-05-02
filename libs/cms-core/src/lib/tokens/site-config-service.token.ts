import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AboutPageConfig, SiteConfig } from '../models/site-config.model';

export interface ISiteConfigService {
  /**
   * Full site config for the current tenant; null if missing or read fails.
   * Preferred over getDefaultSiteConfig() and getConfig().
   */
  getSiteConfig(): Observable<SiteConfig | null>;

  /** @deprecated Use getSiteConfig(). Will be removed in cms-core 2.0. */
  getDefaultSiteConfig(): Observable<SiteConfig | null>;

  getAboutConfig(): Observable<AboutPageConfig | null>;

  /** @deprecated Use getSiteConfig(). Throws on Firestore failure. Will be removed in cms-core 2.0. */
  getConfig(): Observable<SiteConfig>;
}

export const SITE_CONFIG_SERVICE = new InjectionToken<ISiteConfigService>(
  'SITE_CONFIG_SERVICE',
);
