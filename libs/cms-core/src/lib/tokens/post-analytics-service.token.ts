import { InjectionToken } from '@angular/core';

export interface IPostAnalyticsService {
  /**
   * Fire-and-forget view beacon. No-op on the server. Never throws —
   * analytics failures must not degrade the render path.
   */
  recordView(postId: string): void;
}

export const BLOG_POST_ANALYTICS_SERVICE = new InjectionToken<IPostAnalyticsService>(
  'BLOG_POST_ANALYTICS_SERVICE',
);
