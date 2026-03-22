import type { AboutPage, LinksPage } from '@foliokit/cms-core';

/**
 * The route data key used by AboutPageComponent and LinksPageComponent
 * to read their page from Angular Router resolved data.
 *
 * Use this constant in your route definition's `resolve` map so the key
 * stays in sync with what the components expect:
 *
 * ```ts
 * {
 *   path: 'about',
 *   component: AboutPageComponent,
 *   resolve: { [CMS_ROUTE_DATA_KEY]: aboutPageResolver }
 * }
 * ```
 */
export const CMS_ROUTE_DATA_KEY = 'page' as const;

/**
 * Shape of the resolved route data expected by AboutPageComponent.
 * Use as the return type annotation on your resolver:
 *
 * ```ts
 * export const aboutPageResolver: ResolveFn<AboutPageRouteData[typeof CMS_ROUTE_DATA_KEY]> = ...
 * ```
 */
export interface AboutPageRouteData {
  [CMS_ROUTE_DATA_KEY]: AboutPage | null;
}

/**
 * Shape of the resolved route data expected by LinksPageComponent.
 */
export interface LinksPageRouteData {
  [CMS_ROUTE_DATA_KEY]: LinksPage | null;
}
