import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

if (!getApps().length) initializeApp();

export const publishScheduledPosts = onSchedule('every 5 minutes', async () => {
  const db = getFirestore();
  const now = Timestamp.now();

  const snapshot = await db
    .collection('posts')
    .where('status', '==', 'scheduled')
    .where('scheduledPublishAt', '<=', now)
    .get();

  if (snapshot.empty) {
    logger.info('publishScheduledPosts: no posts due', { count: 0 });
    return;
  }

  const batch = db.batch();
  for (const docSnap of snapshot.docs) {
    const scheduledAt = docSnap.data()['scheduledPublishAt'] as Timestamp;
    batch.update(docSnap.ref, {
      status: 'published',
      publishedAt: scheduledAt, // preserve intended publish time, not Timestamp.now()
    });
  }
  await batch.commit();

  logger.info('publishScheduledPosts: published posts', { count: snapshot.size });
});
