import { InjectionToken, makeStateKey } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CmsPageUnion } from '../models/page.model';

/**
 * @deprecated IPageService is superseded by SiteConfigService for the About page.
 * Retained for LinksPage support only. Will be removed in a future release.
 */
export interface IPageService {
  getPageBySlug(slug: string): Observable<CmsPageUnion | null>;
  getPageById(id: string): Observable<CmsPageUnion | null>;
}

/**
 * @deprecated BLOG_PAGE_SERVICE is superseded by SiteConfigService for the About page.
 * Retained for LinksPage support only. Will be removed in a future release.
 */
export const BLOG_PAGE_SERVICE = new InjectionToken<IPageService>(
  'BLOG_PAGE_SERVICE',
);

/**
 * @deprecated PAGE_TRANSFER_KEY is superseded by the ABOUT_PAGE_KEY in aboutPageResolver.
 * Retained for LinksPage support only. Will be removed in a future release.
 */
export const PAGE_TRANSFER_KEY = makeStateKey<CmsPageUnion | null>('cms-page');
