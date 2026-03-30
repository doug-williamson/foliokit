/**
 * Tenant seed script — foliokit
 *
 * Writes initial data under tenants/foliokit/* in the foliokit-6f974 project.
 *
 * Prerequisites:
 *   1. Download a service account key from Firebase Console >
 *      Project Settings > Service Accounts > Generate new private key
 *   2. Save it outside the repo (e.g. ~/.config/foliokit/service-account.json)
 *   3. Export the path:
 *        export GOOGLE_APPLICATION_CREDENTIALS=~/.config/foliokit/service-account.json
 *   4. Run:
 *        nx run seed:tenant-foliokit
 *
 * Re-running this script will overwrite all seeded documents.
 */

import * as admin from 'firebase-admin';

const TENANT_ID = 'foliokit';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'foliokit-6f974',
  });
}

const db = admin.firestore();
const tenant = (collection: string) =>
  db.collection(`tenants/${TENANT_ID}/${collection}`);

async function seed(): Promise<void> {
  try {
    console.log(`[seed] Writing tenants/${TENANT_ID}/authors/author-1...`);
    await tenant('authors').doc('author-1').set(
      {
        id: 'author-1',
        name: 'FolioKit Team',
        bio: 'Building the open-source Angular blog platform.',
        avatarUrl: '',
        socialLinks: [],
      },
      { merge: false }
    );

    console.log(`[seed] Writing tenants/${TENANT_ID}/tags/tag-web...`);
    await tenant('tags').doc('tag-web').set(
      {
        id: 'tag-web',
        label: 'Web Development',
        slug: 'web-development',
      },
      { merge: false }
    );

    console.log(`[seed] Writing tenants/${TENANT_ID}/tags/tag-angular...`);
    await tenant('tags').doc('tag-angular').set(
      {
        id: 'tag-angular',
        label: 'Angular',
        slug: 'angular',
      },
      { merge: false }
    );

    console.log(
      `[seed] Writing tenants/${TENANT_ID}/site-config/${TENANT_ID}...`
    );
    await tenant('site-config')
      .doc(TENANT_ID)
      .set(
        {
          id: TENANT_ID,
          siteName: 'FolioKit Blog',
          siteUrl: 'https://foliokit-6f974.web.app',
          defaultAuthorId: 'author-1',
          nav: [
            { label: 'Home', url: '/' },
            { label: 'Posts', url: '/posts' },
          ],
          pages: {
            home: {
              enabled: true,
              heroHeadline: 'FolioKit Blog',
              heroSubheadline:
                'The Angular + Firebase blog platform for developers.',
              ctaLabel: 'Read Posts',
              ctaUrl: '/posts',
              showRecentPosts: true,
            },
            about: { enabled: false, headline: '', bio: '' },
            links: { enabled: false, links: [] },
          },
          defaultSeo: {
            title: 'FolioKit Blog',
            description:
              'The Angular + Firebase blog platform for developers.',
            ogImage: '',
            canonicalUrl: 'https://foliokit-6f974.web.app',
          },
          updatedAt: admin.firestore.Timestamp.now(),
        },
        { merge: false }
      );

    console.log(`[seed] Writing tenants/${TENANT_ID}/posts/post-1...`);
    await tenant('posts').doc('post-1').set(
      {
        id: 'post-1',
        slug: 'hello-world',
        title: 'Hello World',
        subtitle: 'FolioKit is live',
        excerpt:
          'This is the first post on the FolioKit blog, verifying the full read stack.',
        content: `# Hello World\n\nThis is the first post. It exists to verify that Firestore reads, markdown rendering, and the blog UI are all wired up correctly.\n\n## What is FolioKit?\n\nFolioKit is an Angular + Firebase blog platform. Drop it into any Angular project, wire up a Firebase project, and you have a fully functional blog with an admin dashboard.\n\n## What's next?\n\nMore posts coming soon.\n`,
        contentFormat: 'markdown',
        embeddedMedia: {},
        contentVersion: 1,
        thumbnailUrl: '',
        thumbnailAlt: '',
        authorId: 'author-1',
        tags: ['web-development', 'angular'],
        status: 'published',
        publishedAt: admin.firestore.Timestamp.fromDate(new Date('2025-01-01')),
        scheduledPublishAt: null,
        updatedAt: admin.firestore.Timestamp.fromDate(new Date('2025-01-01')),
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-01-01')),
        readingTimeMinutes: 1,
        seo: {
          title: 'Hello World — FolioKit Blog',
          description:
            'The first post on the FolioKit blog, verifying the full read stack.',
          ogImage: '',
          canonicalUrl:
            'https://foliokit-6f974.web.app/posts/hello-world',
        },
      },
      { merge: false }
    );

    console.log('[seed] Done.');
  } catch (err) {
    console.error('[seed] Error:', err);
    process.exit(1);
  }
}

seed();
