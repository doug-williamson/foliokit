import { InjectionToken, makeStateKey } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CmsPageUnion } from '../models/page.model';

export interface IPageService {
  getPageBySlug(slug: string): Observable<CmsPageUnion | null>;
  getPageById(id: string): Observable<CmsPageUnion | null>;
}

export const BLOG_PAGE_SERVICE = new InjectionToken<IPageService>(
  'BLOG_PAGE_SERVICE',
);

export const PAGE_TRANSFER_KEY = makeStateKey<CmsPageUnion | null>('cms-page');
