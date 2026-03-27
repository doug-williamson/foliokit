import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { of } from 'rxjs';
import type { BlogPost } from '@foliokit/cms-core';
import { SEED_POSTS } from '../data/seed-posts';

export const postResolver: ResolveFn<BlogPost | null> = (route) => {
  const slug = route.paramMap.get('slug');
  const post = SEED_POSTS.find((p) => p.slug === slug && p.status === 'published') ?? null;
  if (!post) {
    inject(Router).navigate(['/blog']);
  }
  return of(post);
};
