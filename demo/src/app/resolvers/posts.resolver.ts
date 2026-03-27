import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import type { BlogPost } from '@foliokit/cms-core';
import { SEED_POSTS } from '../data/seed-posts';

export const postsResolver: ResolveFn<BlogPost[]> = () =>
  of(SEED_POSTS.filter((p) => p.status === 'published').sort((a, b) => b.publishedAt - a.publishedAt));
