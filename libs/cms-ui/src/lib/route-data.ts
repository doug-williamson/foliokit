import type { AboutPageConfig, LinksPageConfig } from '@foliokit/cms-core';

/**
 * The route data key used by LinksPageComponent to read its page from Angular
 * Router resolved data.
 */
export const CMS_ROUTE_DATA_KEY = 'page' as const;

/**
 * The route data key used by AboutPageComponent to read its config from Angular
 * Router resolved data.
 */
export const ABOUT_ROUTE_DATA_KEY = 'about' as const;

/**
 * Shape of the resolved route data expected by AboutPageComponent.
 */
export interface AboutPageRouteData {
  [ABOUT_ROUTE_DATA_KEY]: AboutPageConfig | null;
}

/**
 * Shape of the resolved route data expected by LinksPageComponent.
 */
export interface LinksPageRouteData {
  [CMS_ROUTE_DATA_KEY]: LinksPageConfig | null;
}
