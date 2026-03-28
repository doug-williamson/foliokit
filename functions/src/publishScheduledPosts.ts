import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

if (!getApps().length) initializeApp();

function scheduledPublishAtToMillis(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value instanceof Timestamp) return value.toMillis();
  const v = value as { toMillis?: () => number };
  if (typeof v.toMillis === 'function') return v.toMillis();
  return null;
}

function publishedAtForWrite(raw: unknown, ms: number): Timestamp {
  if (raw instanceof Timestamp) return raw;
  return Timestamp.fromMillis(ms);
}

export const publishScheduledPosts = onSchedule('every 5 minutes', async () => {
  const db = getFirestore();
  const nowMs = Date.now();

  const snapshot = await db.collection('posts').where('status', '==', 'scheduled').get();

  const batch = db.batch();
  let count = 0;
  for (const docSnap of snapshot.docs) {
    const raw = docSnap.data()['scheduledPublishAt'];
    const scheduledMs = scheduledPublishAtToMillis(raw);
    if (scheduledMs === null || scheduledMs > nowMs) continue;

    batch.update(docSnap.ref, {
      status: 'published',
      publishedAt: publishedAtForWrite(raw, scheduledMs),
    });
    count++;
  }

  if (count === 0) {
    logger.info('publishScheduledPosts: no posts due', { count: 0 });
    return;
  }

  await batch.commit();
  logger.info('publishScheduledPosts: published posts', { count });
});
