import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { AboutPageConfig, SiteConfig } from '../models/site-config.model';

export interface ISiteConfigService {
  getAboutConfig(): Observable<AboutPageConfig | null>;
  getFeatures(): Observable<NonNullable<SiteConfig['features']>>;
}

export const SITE_CONFIG_SERVICE = new InjectionToken<ISiteConfigService>(
  'SITE_CONFIG_SERVICE',
);
