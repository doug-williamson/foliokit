import { InjectionToken, makeStateKey } from '@angular/core';
import type { Observable } from 'rxjs';
import type { BlogPost, SeriesNavItem } from '../models/post.model';

export interface IBlogPostService {
  getPublishedPosts(): Observable<BlogPost[]>;
  getPostBySlug(slug: string): Observable<BlogPost | null>;
  getPublishedPostsBySeriesId?(seriesId: string): Observable<SeriesNavItem[]>;
}

export const BLOG_POST_SERVICE = new InjectionToken<IBlogPostService>(
  'BLOG_POST_SERVICE',
);

export const POSTS_TRANSFER_KEY = makeStateKey<BlogPost[]>('blog-posts');
