/**
 * Launch announcement blog post — seed data for Firestore.
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS=~/.config/foliokit/service-account.json
 *   npx ts-node tools/seed/launch-post.ts [--tenant <id>]
 *
 * This creates (or overwrites) a single "introducing-foliokit" post in Firestore
 * under tenants/{tenantId}/.
 */

import * as admin from 'firebase-admin';

const args = process.argv.slice(2);
const tenantArgIndex = args.indexOf('--tenant');
const TENANT_ID = tenantArgIndex !== -1 ? args[tenantArgIndex + 1] : 'foliokitcms';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'foliokit-6f974',
  });
}

const db = admin.firestore();
const tenant = (collection: string) =>
  db.collection(`tenants/${TENANT_ID}/${collection}`);

const content = `# Introducing FolioKit: An Angular CMS for Personal Sites

FolioKit is an open-source Angular CMS built on Firebase. Ship a personal blog,
portfolio, or link-in-bio site in minutes — not months.

## Why FolioKit?

Personal sites shouldn't need a CMS team. Most developers want a clean blog with
markdown support, a portfolio page, and maybe a links page — not a full-blown
headless CMS with dozens of content types and a GraphQL API.

FolioKit gives you exactly what you need:

- **Markdown-first blog** with syntax highlighting and embedded media
- **Portfolio & links pages** out of the box
- **Dark mode** via CSS design tokens and a single toggle
- **Firebase backend** — Firestore, Storage, Auth, and Cloud Functions
- **Zero backend code** to write — just configure and deploy

## Architecture

FolioKit is built as an Nx monorepo with four npm packages:

| Package | Purpose |
|---------|---------|
| \`@foliokit/cms-core\` | Firebase services, data models, DI tokens |
| \`@foliokit/cms-ui\` | App shell, page components, design tokens |
| \`@foliokit/cms-markdown\` | Markdown rendering with embedded media |
| \`@foliokit/cms-admin-ui\` | Admin editor (signal stores, post management) |

The stack: **Angular 21** with signals, **Firebase** (Firestore + Storage + Auth),
**Material 3** design tokens, and **SSR** via Angular Universal.

## Getting Started in 5 Minutes

\`\`\`bash
# 1. Clone the starter template
git clone https://github.com/doug-williamson/foliokit-starter my-site
cd my-site

# 2. Install dependencies
npm install

# 3. Add your Firebase config
#    Edit src/environments/environment.ts with your project credentials

# 4. Seed your Firestore with sample data
#    See the README for the seed script

# 5. Run locally
ng serve
\`\`\`

That's it. You have a working blog with dark mode, markdown rendering,
tag filtering, and SEO metadata — all backed by Firebase.

## The Demo: Stark Industries Lab Notes

We built a demo site themed as Tony Stark's engineering journal to showcase
what FolioKit can do. It features:

- A home page with hero section and recent posts
- A "Lab Notes" blog with tagged, searchable posts
- An about page with social links
- A links page (link-in-bio style)

Check it out at [stark.foliokit.dev](https://stark.foliokit.dev).

## What's Next

FolioKit 1.0 is the foundation. Here's what's on the roadmap:

- **Theming system** — swap colour palettes and typography with a single config
- **Plugin architecture** — extend FolioKit with custom page types and widgets
- **Admin UI stabilisation** — promote \`@foliokit/cms-admin-ui\` to 1.0 with a stable API
- **More starter templates** — portfolio-focused, minimal, and documentation site variants

## Get Involved

FolioKit is MIT-licensed and open source. Contributions, bug reports, and
feature requests are welcome.

- GitHub: [doug-williamson/foliokit](https://github.com/doug-williamson/foliokit)
- Docs: [foliokitcms.com](https://foliokitcms.com)
`;

async function seedLaunchPost(): Promise<void> {
  const now = admin.firestore.Timestamp.now();

  console.log(`[seed] Writing tenants/${TENANT_ID}/posts/introducing-foliokit...`);
  await tenant('posts').doc('introducing-foliokit').set(
    {
      id: 'introducing-foliokit',
      slug: 'introducing-foliokit',
      title: 'Introducing FolioKit: An Angular CMS for Personal Sites',
      subtitle: 'Ship a personal blog, portfolio, or link-in-bio site in minutes.',
      excerpt:
        'FolioKit is an open-source Angular CMS built on Firebase. Ship a personal blog, portfolio, or link-in-bio site in minutes — not months.',
      content,
      contentFormat: 'markdown',
      embeddedMedia: {},
      contentVersion: 1,
      thumbnailUrl: '',
      thumbnailAlt: '',
      authorId: 'author-1',
      tags: ['announcement', 'open-source'],
      status: 'draft',
      publishedAt: null,
      scheduledPublishAt: null,
      updatedAt: now,
      createdAt: now,
      readingTimeMinutes: 3,
      seo: {
        title: 'Introducing FolioKit',
        description:
          'FolioKit is an open-source Angular CMS built on Firebase. Ship a personal blog, portfolio, or link-in-bio site in minutes.',
        ogImage: '',
        canonicalUrl: 'https://foliokitcms.com/posts/introducing-foliokit',
      },
    },
    { merge: false }
  );

  // Ensure the announcement and open-source tags exist
  console.log(`[seed] Writing tenants/${TENANT_ID}/tags/announcement...`);
  await tenant('tags').doc('announcement').set(
    { id: 'announcement', label: 'Announcement', slug: 'announcement' },
    { merge: false }
  );

  console.log(`[seed] Writing tenants/${TENANT_ID}/tags/open-source...`);
  await tenant('tags').doc('open-source').set(
    { id: 'open-source', label: 'Open Source', slug: 'open-source' },
    { merge: false }
  );

  console.log('[seed] Launch post seeded (status: draft).');
}

seedLaunchPost().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
