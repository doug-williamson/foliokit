/**
 * Firestore emulator seed script
 *
 * Prerequisites:
 *   1. Start the Firebase emulator suite:
 *        npm run emulator
 *   2. In a separate terminal, run:
 *        nx run seed:emulator
 *
 * Re-running this script will overwrite all seed documents.
 */

// Must be set before any firebase-admin import to redirect traffic to the emulator.
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { FIREBASE_EMULATOR_PROJECT_ID } from './emulator-config';

initializeApp({ projectId: FIREBASE_EMULATOR_PROJECT_ID });

const db = getFirestore();

async function seed(): Promise<void> {
  try {
    console.log('[seed:emulator] Writing /authors/author-1...');
    await db.collection('authors').doc('author-1').set(
      {
        id: 'author-1',
        name: 'Dev Author',
        bio: 'Test bio',
        avatarUrl: '',
        socialLinks: [],
      },
      { merge: false }
    );

    console.log('[seed:emulator] Writing /tags/tag-web...');
    await db.collection('tags').doc('tag-web').set(
      {
        id: 'tag-web',
        label: 'Web',
        slug: 'web',
      },
      { merge: false }
    );

    console.log('[seed:emulator] Writing /tags/tag-angular...');
    await db.collection('tags').doc('tag-angular').set(
      {
        id: 'tag-angular',
        label: 'Angular',
        slug: 'angular',
      },
      { merge: false }
    );

    console.log('[seed:emulator] Writing /site-config/default...');
    await db.collection('site-config').doc('default').set(
      {
        id: 'default',
        siteName: 'FolioKit Blog',
        siteUrl: 'http://localhost:4200',
        defaultAuthorId: 'author-1',
        nav: [
          { label: 'Home', url: '/' },
          { label: 'About', url: '/about' },
        ],
        defaultSeo: {
          metaTitle: 'FolioKit Blog',
          metaDescription: 'A dev blog.',
        },
      },
      { merge: false }
    );

    console.log('[seed:emulator] Writing /posts/post-1...');
    await db.collection('posts').doc('post-1').set(
      {
        id: 'post-1',
        slug: 'hello-world',
        title: 'Hello World',
        subtitle: 'First post on FolioKit',
        excerpt: 'This is the first post seeded into the emulator.',
        content:
          '## Hello\n\nThis is **markdown** content.\n\nLorem ipsum dolor sit amet.',
        contentFormat: 'markdown',
        embeddedMedia: {},
        contentVersion: 1,
        thumbnailUrl: 'https://picsum.photos/seed/post1/800/450',
        thumbnailAlt: 'Hello World thumbnail',
        authorId: 'author-1',
        tags: ['tag-web', 'tag-angular'],
        status: 'published',
        publishedAt: Timestamp.fromDate(new Date('2025-01-01')),
        updatedAt: Timestamp.fromDate(new Date('2025-01-01')),
        createdAt: Timestamp.fromDate(new Date('2025-01-01')),
        readingTimeMinutes: 2,
        seo: {
          metaTitle: 'Hello World',
          metaDescription: 'First post.',
        },
      },
      { merge: false }
    );

    console.log('[seed:emulator] Writing /posts/post-2...');
    await db.collection('posts').doc('post-2').set(
      {
        id: 'post-2',
        slug: 'angular-signals',
        title: 'Angular Signals Deep Dive',
        subtitle: 'Everything you need to know',
        excerpt:
          'Signals are the future of Angular reactivity. Here is a deep dive.',
        content:
          '## Signals\n\nAngular signals replace zone.js-based change detection.\n\n### Usage\n\nUse `signal()` to create reactive state.',
        contentFormat: 'markdown',
        embeddedMedia: {},
        contentVersion: 1,
        thumbnailUrl: 'https://picsum.photos/seed/post2/800/450',
        thumbnailAlt: 'Angular Signals Deep Dive thumbnail',
        authorId: 'author-1',
        tags: ['tag-angular'],
        status: 'published',
        publishedAt: Timestamp.fromDate(new Date('2025-02-01')),
        updatedAt: Timestamp.fromDate(new Date('2025-02-01')),
        createdAt: Timestamp.fromDate(new Date('2025-02-01')),
        readingTimeMinutes: 3,
        seo: {
          metaTitle: 'Angular Signals Deep Dive',
          metaDescription: 'Signals are the future of Angular reactivity.',
        },
      },
      { merge: false }
    );

    console.log('[seed:emulator] Done.');
  } catch (err) {
    console.error('[seed:emulator] Error:', err);
    process.exit(1);
  }
}

seed();
