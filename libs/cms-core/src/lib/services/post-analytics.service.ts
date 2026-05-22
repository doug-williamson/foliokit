import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { httpsCallable } from 'firebase/functions';
import { FIREBASE_FUNCTIONS } from '../firebase/firebase.config';
import { SITE_ID } from '../firebase/foliokit.providers';
import type { IPostAnalyticsService } from '../tokens/post-analytics-service.token';
import type { PostViewEvent } from '../models/post-analytics.model';

const SESSION_ID_STORAGE_KEY = 'foliokit:analytics:sessionId';

/**
 * Browser-only analytics beacon. Wraps a single HTTPS callable that
 * increments the post's denormalized `viewCount` on the server.
 *
 * All work is wrapped in try/catch and fire-and-forget — analytics failures
 * must never degrade the render path.
 */
@Injectable({ providedIn: 'root' })
export class PostAnalyticsService implements IPostAnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly functions = inject(FIREBASE_FUNCTIONS, { optional: true });
  private readonly tenantId = inject(SITE_ID, { optional: true });

  recordView(postId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.functions) return;
    if (!postId) return;

    try {
      const sessionId = this.getOrCreateSessionId();
      if (!sessionId) return;
      const fn = httpsCallable<PostViewEvent, { ok?: boolean; skipped?: boolean }>(
        this.functions,
        'recordPostView',
      );
      // Fire-and-forget. Swallow rejections so a failed beacon never bubbles.
      fn({ postId, sessionId, tenantId: this.tenantId ?? undefined }).catch(
        () => undefined,
      );
    } catch {
      // Never throw from the beacon path.
    }
  }

  private getOrCreateSessionId(): string | null {
    try {
      const existing = localStorage.getItem(SESSION_ID_STORAGE_KEY);
      if (existing) return existing;
      const fresh =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_ID_STORAGE_KEY, fresh);
      return fresh;
    } catch {
      return null;
    }
  }
}
