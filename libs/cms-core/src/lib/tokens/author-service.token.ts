import { InjectionToken, makeStateKey } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Author } from '../models/author.model';
import type { BlogPost, SeriesNavItem } from '../models/post.model';
import type { Series } from '../models/series.model';

export interface IAuthorService {
  getById(id: string): Observable<Author | null>;
}

export const AUTHOR_SERVICE = new InjectionToken<IAuthorService>(
  'AUTHOR_SERVICE',
);

export const POST_DETAIL_KEY = makeStateKey<BlogPost | null>('post-detail');
export const POST_AUTHOR_KEY = makeStateKey<Author | null>('post-detail-author');
export const POST_SERIES_KEY = makeStateKey<Series | null>('post-series');
export const POST_SERIES_POSTS_KEY = makeStateKey<SeriesNavItem[] | null>('post-series-posts');
