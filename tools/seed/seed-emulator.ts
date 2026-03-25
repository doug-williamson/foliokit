/**
 * Firestore emulator seed script
 *
 * Prerequisites:
 *   1. Start the Firebase emulator suite:
 *        npm run emulator
 *   2. In a separate terminal, run:
 *        npm run seed
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

const now = Timestamp.now();

async function seed(): Promise<void> {
  try {
    console.log('[seed:emulator] Writing /authors/author-1...');
    await db.collection('authors').doc('author-1').set(
      {
        id: 'author-1',
        name: 'Dev Author',
        slug: 'dev-author',
        bio: 'Test bio for local development.',
        avatarUrl: 'https://i.pravatar.cc/150?u=dev-author',
        email: '',
        social: [],
        createdAt: Timestamp.fromDate(new Date('2025-01-01')),
        updatedAt: now,
      },
      { merge: false }
    );

    console.log('[seed:emulator] Writing /tags/tag-web...');
    await db.collection('tags').doc('tag-web').set(
      { id: 'tag-web', label: 'Web', slug: 'web' },
      { merge: false }
    );

    console.log('[seed:emulator] Writing /tags/tag-angular...');
    await db.collection('tags').doc('tag-angular').set(
      { id: 'tag-angular', label: 'Angular', slug: 'angular' },
      { merge: false }
    );

    console.log('[seed:emulator] Writing /site-config/default...');
    await db.collection('site-config').doc('default').set(
      {
        id: 'default',
        siteName: 'FolioKit Blog',
        siteUrl: 'http://localhost:4201',
        description: 'A developer portfolio and blog.',
        defaultAuthorId: 'author-1',
        nav: [
          { label: 'Home', url: '/', order: 0 },
          { label: 'Blog', url: '/posts', order: 1 },
          { label: 'About', url: '/about', order: 2 },
          { label: 'Links', url: '/links', order: 3 },
        ],
        pages: {
          about: {
            enabled: true,
            headline: 'Hey, I\'m Dev Author',
            subheadline: 'Engineer, writer, and open-source tinkerer',
            bio: 'I build things for the web — mostly with Angular and Firebase.\n\nCurrently exploring signals-based architecture and design systems. When I\'m not coding I\'m writing about what I\'ve learned here on the blog.',
            photoUrl: 'https://i.pravatar.cc/150?u=dev-author',
            photoAlt: 'Dev Author profile photo',
            socialLinks: [
              { platform: 'github', url: 'https://github.com/dev-author', label: 'GitHub' },
              { platform: 'bluesky', url: 'https://bsky.app/profile/dev-author.bsky.social', label: 'Bluesky' },
              { platform: 'twitter', url: 'https://twitter.com/dev_author', label: 'Twitter / X' },
            ],
            seo: {
              title: 'About — FolioKit Blog',
              description: 'Learn more about Dev Author, an engineer and writer focused on Angular and Firebase.',
            },
          },
          links: {
            enabled: true,
            title: 'Dev Author — Links',
            headline: 'Dev Author',
            bio: 'Engineer · Writer · Open-source tinkerer',
            avatarUrl: 'https://i.pravatar.cc/150?u=dev-author',
            links: [
              {
                id: 'link-blog',
                label: 'My Blog',
                url: 'http://localhost:4201/posts',
                platform: 'website',
                highlighted: true,
                order: 0,
              },
              {
                id: 'link-github',
                label: 'GitHub',
                url: 'https://github.com/dev-author',
                platform: 'github',
                highlighted: false,
                order: 1,
              },
              {
                id: 'link-bluesky',
                label: 'Bluesky',
                url: 'https://bsky.app/profile/dev-author.bsky.social',
                platform: 'bluesky',
                highlighted: false,
                order: 2,
              },
              {
                id: 'link-twitter',
                label: 'Twitter / X',
                url: 'https://twitter.com/dev_author',
                platform: 'twitter',
                highlighted: false,
                order: 3,
              },
            ],
          },
        },
        updatedAt: now,
      },
      { merge: false }
    );

    // ── pages ──────────────────────────────────────────────────────────────────

    console.log('[seed:emulator] Writing /pages/links...');
    await db.collection('pages').doc('links').set(
      {
        id: 'links',
        type: 'links',
        slug: 'links',
        title: 'Dev Author — Links',
        status: 'published',
        avatarUrl: 'https://i.pravatar.cc/150?u=dev-author',
        avatarAlt: 'Dev Author profile photo',
        headline: 'Dev Author',
        bio: 'Engineer · Writer · Open-source tinkerer',
        links: [
          {
            id: 'link-blog',
            label: 'My Blog',
            url: 'http://localhost:4201/posts',
            platform: 'website',
            highlighted: true,
            order: 0,
          },
          {
            id: 'link-github',
            label: 'GitHub',
            url: 'https://github.com/dev-author',
            platform: 'github',
            highlighted: false,
            order: 1,
          },
          {
            id: 'link-bluesky',
            label: 'Bluesky',
            url: 'https://bsky.app/profile/dev-author.bsky.social',
            platform: 'bluesky',
            highlighted: false,
            order: 2,
          },
          {
            id: 'link-twitter',
            label: 'Twitter / X',
            url: 'https://twitter.com/dev_author',
            platform: 'twitter',
            highlighted: false,
            order: 3,
          },
        ],
        seo: {
          title: 'Links — FolioKit Blog',
          description: 'Find Dev Author across the web.',
        },
        createdAt: Timestamp.fromDate(new Date('2025-01-01')),
        updatedAt: now,
      },
      { merge: false }
    );

    // ── published ──────────────────────────────────────────────────────────────

    console.log('[seed:emulator] Writing /posts/post-1 (published)...');
    await db.collection('posts').doc('post-1').set(
      {
        id: 'post-1',
        slug: 'hello-world',
        title: 'Hello World',
        subtitle: 'First post on FolioKit',
        excerpt: 'This is the first post seeded into the emulator.',
        content: '## Hello\n\nThis is **markdown** content.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.',
        embeddedMedia: {},
        thumbnailUrl: 'https://picsum.photos/seed/post1/800/450',
        thumbnailAlt: 'Hello World thumbnail',
        authorId: 'author-1',
        tags: ['tag-web', 'tag-angular'],
        status: 'published',
        readingTimeMinutes: 2,
        seo: { title: 'Hello World', description: 'First post.' },
        publishedAt: Timestamp.fromDate(new Date('2025-01-01')),
        createdAt: Timestamp.fromDate(new Date('2025-01-01')),
        updatedAt: Timestamp.fromDate(new Date('2025-03-10')),
      },
      { merge: false }
    );

    console.log('[seed:emulator] Writing /posts/post-2 (published)...');
    await db.collection('posts').doc('post-2').set(
      {
        id: 'post-2',
        slug: 'angular-signals',
        title: 'Angular Signals Deep Dive',
        subtitle: 'Everything you need to know',
        excerpt: 'Signals are the future of Angular reactivity. Here is a deep dive.',
        content: '## Signals\n\nAngular signals replace zone.js-based change detection.\n\n### Usage\n\nUse `signal()` to create reactive state.\n\n```ts\nconst count = signal(0);\ncount.update(n => n + 1);\n```',
        embeddedMedia: {},
        thumbnailUrl: 'https://picsum.photos/seed/post2/800/450',
        thumbnailAlt: 'Angular Signals Deep Dive thumbnail',
        authorId: 'author-1',
        tags: ['tag-angular'],
        status: 'published',
        readingTimeMinutes: 3,
        seo: { title: 'Angular Signals Deep Dive', description: 'Signals are the future of Angular reactivity.' },
        publishedAt: Timestamp.fromDate(new Date('2025-02-01')),
        createdAt: Timestamp.fromDate(new Date('2025-02-01')),
        updatedAt: Timestamp.fromDate(new Date('2025-03-12')),
      },
      { merge: false }
    );

    // ── scheduled ──────────────────────────────────────────────────────────────

    console.log('[seed:emulator] Writing /posts/post-3 (scheduled)...');
    await db.collection('posts').doc('post-3').set(
      {
        id: 'post-3',
        slug: 'tailwind-v4-first-look',
        title: 'Tailwind v4 First Look',
        subtitle: 'What changes, what stays the same',
        excerpt: 'Tailwind CSS v4 brings a new engine and CSS-first configuration. Here is what to expect.',
        content: '## What is New\n\nTailwind v4 ditches `tailwind.config.js` in favour of CSS-native configuration using `@theme`.\n\n```css\n@theme {\n  --color-primary: oklch(0.6 0.2 270);\n}\n```',
        embeddedMedia: {},
        thumbnailUrl: 'https://picsum.photos/seed/post3/800/450',
        thumbnailAlt: 'Tailwind v4 thumbnail',
        authorId: 'author-1',
        tags: ['tag-web'],
        status: 'scheduled',
        readingTimeMinutes: 4,
        seo: { title: 'Tailwind v4 First Look', description: 'What changes in Tailwind v4.' },
        publishedAt: Timestamp.fromDate(new Date('2099-01-01')),
        scheduledPublishAt: Timestamp.fromDate(new Date('2026-04-01')),
        createdAt: Timestamp.fromDate(new Date('2026-03-14')),
        updatedAt: Timestamp.fromDate(new Date('2026-03-15')),
      },
      { merge: false }
    );

    // ── draft ──────────────────────────────────────────────────────────────────

    console.log('[seed:emulator] Writing /posts/post-4 (draft)...');
    await db.collection('posts').doc('post-4').set(
      {
        id: 'post-4',
        slug: 'ngrx-signals-patterns',
        title: 'NgRx Signals Store Patterns',
        subtitle: '',
        excerpt: '',
        content: '## WIP\n\nNotes on component-scoped stores, `withMethods`, and lazy loading.\n\n_More coming soon..._',
        embeddedMedia: {},
        thumbnailUrl: '',
        thumbnailAlt: '',
        authorId: 'author-1',
        tags: ['tag-angular'],
        status: 'draft',
        readingTimeMinutes: 0,
        seo: {},
        publishedAt: Timestamp.fromDate(new Date('2099-01-01')),
        scheduledPublishAt: null,
        createdAt: Timestamp.fromDate(new Date('2026-03-18')),
        updatedAt: Timestamp.fromDate(new Date('2026-03-18')),
      },
      { merge: false }
    );

    console.log('[seed:emulator] Done. 1 author, 2 tags, 1 site-config (about + links enabled, 4 nav items), 1 pages/links, 4 posts (2 published, 1 scheduled, 1 draft) written.');
  } catch (err) {
    console.error('[seed:emulator] Error:', err);
    process.exit(1);
  }
}

seed();
