/**
 * Firestore seed script — foliokit-6f974
 *
 * Prerequisites:
 *   1. Download a service account key from Firebase Console >
 *      Project Settings > Service Accounts > Generate new private key
 *   2. Save it outside the repo (e.g. ~/.config/foliokit/service-account.json)
 *   3. Export the path:
 *        export GOOGLE_APPLICATION_CREDENTIALS=~/.config/foliokit/service-account.json
 *   4. Run:
 *        nx run seed:firestore
 *
 * Re-running this script will overwrite all seed documents.
 */

// Credentials are sourced from the GOOGLE_APPLICATION_CREDENTIALS environment variable,
// which must point to a service account JSON file downloaded from the Firebase Console.
// Never hardcode credentials or commit service account files to the repository.
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'foliokit-6f974',
  });
}

const db = admin.firestore();

async function seed(): Promise<void> {
  try {
    console.log('[seed] Writing /authors/author-1...');
    await db.collection('authors').doc('author-1').set(
      {
        id: 'author-1',
        name: 'Your Name',
        bio: 'Writer and developer.',
        avatarUrl: '',
        socialLinks: [],
      },
      { merge: false }
    );

    console.log('[seed] Writing /tags/tag-web...');
    await db.collection('tags').doc('tag-web').set(
      {
        id: 'tag-web',
        label: 'Web Development',
        slug: 'web-development',
      },
      { merge: false }
    );

    console.log('[seed] Writing /site-config/default...');
    await db.collection('site-config').doc('default').set(
      {
        id: 'default',
        siteName: 'FolioKit Blog',
        siteUrl: 'https://foliokit-6f974.web.app',
        defaultAuthorId: 'author-1',
        nav: [
          { label: 'Home', url: '/' },
          { label: 'Blog', url: '/posts' },
        ],
        pages: {
          home: {
            enabled: true,
            heroHeadline: 'Your Blog Name',
            heroSubheadline: 'Your tagline here.',
            ctaLabel: 'Read Posts',
            ctaUrl: '/posts',
            showRecentPosts: true,
          },
          about: { enabled: false, headline: '', bio: '' },
          links: { enabled: false, links: [] },
        },
        defaultSeo: {
          title: 'FolioKit Blog',
          description: 'A blog built with FolioKit.',
          ogImage: '',
          canonicalUrl: 'https://foliokit-6f974.web.app',
        },
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: false }
    );

    console.log('[seed] Writing /posts/post-1...');
    await db.collection('posts').doc('post-1').set(
      {
        id: 'post-1',
        slug: 'hello-world',
        title: 'Hello World',
        subtitle: 'The first post on FolioKit',
        excerpt:
          'This is the first post created to verify the FolioKit read layer.',
        content: `# Hello World\n\nThis is the first post. It exists to verify that Firestore reads, markdown rendering, and the blog UI are all wired up correctly.\n\n## Why FolioKit?\n\nBecause building a blog should be enjoyable.\n`,
        contentFormat: 'markdown',
        embeddedMedia: {},
        contentVersion: 1,
        thumbnailUrl: '',
        thumbnailAlt: '',
        authorId: 'author-1',
        tags: ['web-development'],
        status: 'published',
        publishedAt: admin.firestore.Timestamp.fromDate(
          new Date('2025-01-01')
        ),
        scheduledPublishAt: null,
        updatedAt: admin.firestore.Timestamp.fromDate(new Date('2025-01-01')),
        createdAt: admin.firestore.Timestamp.fromDate(new Date('2025-01-01')),
        readingTimeMinutes: 1,
        seo: {
          title: 'Hello World — FolioKit',
          description: 'The first post created to verify the FolioKit read layer.',
          ogImage: '',
          canonicalUrl: 'https://foliokit-6f974.web.app/posts/hello-world',
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
