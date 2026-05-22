import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { isbot } from 'isbot';
import { featuresForPlan } from './plan-features';

if (!getApps().length) initializeApp();

interface PostViewPayload {
  postId?: string;
  sessionId?: string;
  tenantId?: string;
}

interface PostViewResult {
  ok?: boolean;
  skipped?: 'bot';
}

/**
 * Anonymous public beacon. The viewer is never authenticated — posts are
 * publicly readable, so we accept the client-supplied tenantId and verify
 * the post exists at the resolved path before incrementing.
 *
 * Bot filter runs first via the `isbot` package. Plan-gated daily aggregate
 * buckets are written for `pro` and `agency` tiers only. `starter` writes
 * the denormalized count on the post doc and nothing else.
 *
 * TODO(analytics-v2): `uniqueVisitors` requires a hashed-sessionId seen-doc
 * per day (TTL'd) to dedup repeat views. Deferred until the analytics
 * dashboard work begins — current write count would double per beacon.
 */
export const recordPostView = onCall<PostViewPayload, Promise<PostViewResult>>(
  async (request): Promise<PostViewResult> => {
    const userAgent = request.rawRequest.headers['user-agent'] ?? '';
    if (isbot(userAgent)) {
      return { skipped: 'bot' };
    }

    const { postId, sessionId, tenantId } = request.data ?? {};
    if (!postId || typeof postId !== 'string') {
      throw new HttpsError('invalid-argument', 'invalid_post_id');
    }
    if (!sessionId || typeof sessionId !== 'string') {
      throw new HttpsError('invalid-argument', 'invalid_session_id');
    }

    const isMultiTenant =
      typeof tenantId === 'string' && tenantId.length > 0 && tenantId !== 'default';
    const postPath = isMultiTenant
      ? `tenants/${tenantId}/posts/${postId}`
      : `posts/${postId}`;

    const db = getFirestore();

    const postSnap = await db.doc(postPath).get();
    if (!postSnap.exists) {
      throw new HttpsError('not-found', 'post_not_found');
    }

    // Plan gating: only pro/agency tiers get daily buckets.
    // billing/{tenantId} writes are bypassed for single-tenant ('default')
    // since there is no per-tenant plan record — defaults to starter.
    let isPro = false;
    if (isMultiTenant) {
      const billingSnap = await db.doc(`billing/${tenantId}`).get();
      const billingData = billingSnap.data() as { plan?: string } | undefined;
      const features = featuresForPlan(billingData?.plan);
      isPro = features.platform.analytics;
    }

    const writes: Array<Promise<unknown>> = [];

    writes.push(
      db.doc(postPath).update({
        viewCount: FieldValue.increment(1),
        viewCountUpdatedAt: FieldValue.serverTimestamp(),
      }),
    );

    if (isPro) {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
      const dailyPath = `tenants/${tenantId}/analytics/posts/${postId}/daily/${today}`;
      writes.push(
        db.doc(dailyPath).set(
          {
            date: today,
            views: FieldValue.increment(1),
          },
          { merge: true },
        ),
      );
    }

    try {
      await Promise.all(writes);
    } catch (err) {
      logger.error('recordPostView: write failed', { error: err, postPath });
      throw new HttpsError('internal', 'write_failed');
    }

    return { ok: true };
  },
);
