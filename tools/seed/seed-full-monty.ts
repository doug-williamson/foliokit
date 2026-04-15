/**
 * Firestore emulator seed script — full-monty
 *
 * Seeds the Firebase Auth and Firestore emulators with a complete, realistic
 * dataset for development and manual QA:
 *   - Auth: creates the sole admin user (Google provider)
 *   - Firestore (all under tenants/foliokitcms/):
 *       • tenant document
 *       • site-config with all 4 pages enabled (Home, Blog, About, Links)
 *       • 1 default author
 *       • 5 series
 *       • ~15 posts (mix of published / draft), several belonging to series
 *
 * Prerequisites:
 *   1. Start the Firebase emulator suite:
 *        npm run emulator
 *   2. In a separate terminal, run:
 *        npx nx run seed:full-monty
 */

// Must be set before any firebase-admin import to redirect traffic to the emulators.
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = '127.0.0.1:9099';
process.env['FIRESTORE_EMULATOR_HOST'] = '127.0.0.1:8080';

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, WriteBatch } from 'firebase-admin/firestore';
import { FIREBASE_EMULATOR_PROJECT_ID } from './emulator-config';

const ADMIN_EMAIL = 'dev.foliokit@gmail.com';
const TENANT_ID = 'foliokitcms';
const AUTHOR_ID = 'author-default';

initializeApp({ projectId: FIREBASE_EMULATOR_PROJECT_ID });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): number {
  return Date.now() - n * 24 * 60 * 60 * 1000;
}

function tenantCol(name: string) {
  return getFirestore().collection(`tenants/${TENANT_ID}/${name}`);
}

// ─── Auth + Tenant ────────────────────────────────────────────────────────────

async function seedAuth(): Promise<void> {
  console.log(`[seed:full-monty] Creating admin user ${ADMIN_EMAIL}...`);
  const { errors } = await getAuth().importUsers([
    {
      uid: 'admin-dev',
      email: ADMIN_EMAIL,
      emailVerified: true,
      displayName: 'Dev FolioKit',
      providerData: [
        {
          uid: ADMIN_EMAIL,
          email: ADMIN_EMAIL,
          displayName: 'Dev FolioKit',
          providerId: 'google.com',
        },
      ],
    },
  ]);
  if (errors.length) {
    console.warn('[seed:full-monty] Auth warnings:', errors.map((e) => e.error.message));
  }
  console.log('[seed:full-monty] Admin user created.');
}

async function seedTenant(): Promise<void> {
  console.log(`[seed:full-monty] Creating tenant document tenants/${TENANT_ID}...`);
  const db = getFirestore();
  await db.collection('tenants').doc(TENANT_ID).set(
    {
      tenantId: TENANT_ID,
      ownerEmail: ADMIN_EMAIL,
      subdomain: TENANT_ID,
      customDomain: null,
      displayName: 'Dev FolioKit',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log('[seed:full-monty] Tenant document created.');
}

// ─── Site Config ──────────────────────────────────────────────────────────────

async function seedSiteConfig(): Promise<void> {
  console.log('[seed:full-monty] Writing site-config...');
  const db = getFirestore();
  await db
    .collection(`tenants/${TENANT_ID}/site-config`)
    .doc(TENANT_ID)
    .set({
      id: TENANT_ID,
      siteName: 'Dev FolioKit',
      siteUrl: 'https://foliokitcms.foliokit.app',
      description: 'A personal blog and portfolio built with FolioKit.',
      defaultAuthorId: AUTHOR_ID,
      onboardingComplete: true,
      pages: {
        home: {
          enabled: true,
          heroHeadline: 'Hello, I\'m Alex Rivera',
          heroSubheadline:
            'Software engineer, open-source contributor, and perpetual learner writing about TypeScript, Angular, and the craft of building great products.',
          ctaLabel: 'Read the Blog',
          ctaUrl: '/blog',
          showRecentPosts: true,
          seo: {
            title: 'Alex Rivera — Software Engineer & Writer',
            description:
              'Personal blog covering TypeScript, Angular, Firebase, design systems, and career growth in tech.',
          },
        },
        blog: {
          enabled: true,
          seo: {
            title: 'Blog — Alex Rivera',
            description: 'Articles on TypeScript, Angular, Firebase, and software engineering craft.',
          },
        },
        about: {
          enabled: true,
          headline: 'About Me',
          subheadline: 'Engineer, writer, occasional over-thinker.',
          bio: `I'm a full-stack software engineer with a decade of experience building web products — from scrappy startups to large-scale enterprise platforms.

My primary stack is **TypeScript**, **Angular**, and **Firebase**, though I spend a lot of time thinking about developer experience, design systems, and how teams can ship faster without sacrificing quality.

Outside of work I enjoy hiking, specialty coffee, and reading way too many technical blog posts about things I'll never have time to implement.

Feel free to reach out — I'm always happy to chat about code, career, or whatever you're working on.`,
          photoUrl: 'https://picsum.photos/seed/alex-light/400/400',
          photoUrlDark: 'https://picsum.photos/seed/alex-dark/400/400',
          photoAlt: 'Alex Rivera headshot',
          socialLinks: [
            { platform: 'github', url: 'https://github.com/alexrivera-dev', label: 'GitHub' },
            { platform: 'twitter', url: 'https://twitter.com/alexrivera_dev', label: 'Twitter / X' },
            { platform: 'linkedin', url: 'https://linkedin.com/in/alexrivera-dev', label: 'LinkedIn' },
            { platform: 'bluesky', url: 'https://bsky.app/profile/alexrivera.dev', label: 'Bluesky' },
          ],
          seo: {
            title: 'About Alex Rivera',
            description: 'Software engineer, open-source contributor, and writer.',
          },
        },
        links: {
          enabled: true,
          title: 'Alex Rivera',
          headline: 'Engineer • Writer • Builder',
          bio: 'TypeScript, Angular & Firebase enthusiast. Writing about software and the people who make it.',
          avatarUrl: 'https://picsum.photos/seed/alex-links-light/200/200',
          avatarUrlDark: 'https://picsum.photos/seed/alex-links-dark/200/200',
          avatarAlt: 'Alex Rivera',
          links: [
            {
              id: 'link-blog',
              label: 'My Blog',
              url: 'https://foliokitcms.foliokit.app/blog',
              icon: 'article',
              order: 0,
              highlighted: true,
            },
            {
              id: 'link-github',
              label: 'GitHub',
              url: 'https://github.com/alexrivera-dev',
              platform: 'github',
              order: 1,
            },
            {
              id: 'link-twitter',
              label: 'Twitter / X',
              url: 'https://twitter.com/alexrivera_dev',
              platform: 'twitter',
              order: 2,
            },
            {
              id: 'link-linkedin',
              label: 'LinkedIn',
              url: 'https://linkedin.com/in/alexrivera-dev',
              platform: 'linkedin',
              order: 3,
            },
            {
              id: 'link-youtube',
              label: 'YouTube',
              url: 'https://youtube.com/@alexrivera_dev',
              platform: 'youtube',
              order: 4,
            },
            {
              id: 'link-email',
              label: 'Email Me',
              url: 'mailto:alex@example.dev',
              platform: 'email',
              order: 5,
            },
          ],
          seo: {
            title: 'Links — Alex Rivera',
            description: 'All the places you can find Alex Rivera online.',
          },
        },
      },
      updatedAt: Date.now(),
    });
  console.log('[seed:full-monty] site-config written.');
}

// ─── Author ───────────────────────────────────────────────────────────────────

async function seedAuthor(): Promise<void> {
  console.log('[seed:full-monty] Writing default author...');
  const now = Date.now();
  await tenantCol('authors').doc(AUTHOR_ID).set({
    id: AUTHOR_ID,
    displayName: 'Alex Rivera',
    bio: 'Software engineer focused on TypeScript, Angular, and Firebase. I write about building products and growing as an engineer.',
    photoUrl: 'https://picsum.photos/seed/alex-light/400/400',
    photoUrlDark: 'https://picsum.photos/seed/alex-dark/400/400',
    email: ADMIN_EMAIL,
    socialLinks: [
      { platform: 'github', url: 'https://github.com/alexrivera-dev', label: 'GitHub' },
      { platform: 'twitter', url: 'https://twitter.com/alexrivera_dev', label: 'Twitter / X' },
      { platform: 'linkedin', url: 'https://linkedin.com/in/alexrivera-dev', label: 'LinkedIn' },
    ],
    createdAt: now,
    updatedAt: now,
  });
  console.log('[seed:full-monty] Default author written.');
}

// ─── Series ───────────────────────────────────────────────────────────────────

const SERIES = [
  {
    id: 'series-ts-deep-dives',
    slug: 'typescript-deep-dives',
    name: 'TypeScript Deep Dives',
    description:
      'A systematic tour of TypeScript\'s advanced type system — from mapped types and conditional types to template literal types and infer tricks.',
    postCount: 3,
  },
  {
    id: 'series-angular-patterns',
    slug: 'angular-patterns',
    name: 'Angular Patterns',
    description:
      'Practical patterns for building scalable Angular applications: signals, standalone components, reactive forms, and more.',
    postCount: 2,
  },
  {
    id: 'series-firebase-firestore',
    slug: 'firebase-and-firestore',
    name: 'Firebase & Firestore',
    description:
      'Real-world guides for Firebase Auth, Firestore data modeling, security rules, and deploying production apps on Google Cloud.',
    postCount: 2,
  },
  {
    id: 'series-design-systems',
    slug: 'design-systems',
    name: 'Design Systems',
    description:
      'How to build and maintain a design system that actually gets used — token architecture, component APIs, and cross-team adoption.',
    postCount: 2,
  },
  {
    id: 'series-career-growth',
    slug: 'career-and-growth',
    name: 'Career & Growth',
    description:
      'Reflections on navigating a software engineering career: mentorship, staff+ leveling, job searches, and staying energised.',
    postCount: 2,
  },
  {
    id: 'series-engineering-dx',
    slug: 'engineering-dx',
    name: 'Engineering DX',
    description:
      'Tools, workflows, and habits that make day-to-day engineering more productive — from test runners and Git tricks to monorepo tooling and CI strategies.',
    postCount: 2,
  },
];

async function seedSeries(batch: WriteBatch): Promise<void> {
  console.log('[seed:full-monty] Writing 6 series...');
  const now = Date.now();
  for (const s of SERIES) {
    const ref = tenantCol('series').doc(s.id);
    batch.set(ref, { ...s, isActive: true, createdAt: now, updatedAt: now });
  }
}

// ─── Posts ────────────────────────────────────────────────────────────────────

interface PostSeed {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  status: 'published' | 'draft';
  content: string;
  excerpt: string;
  tags: string[];
  seriesId?: string;
  seriesOrder?: number;
  readingTimeMinutes: number;
  publishedAt: number;
}

const POSTS: PostSeed[] = [
  // ── TypeScript Deep Dives (3 published) ──────────────────────────────────
  {
    id: 'post-ts-01',
    slug: 'understanding-mapped-types-in-typescript',
    title: 'Understanding Mapped Types in TypeScript',
    subtitle: 'Transform every key of an existing type with a single construct',
    status: 'published',
    seriesId: 'series-ts-deep-dives',
    seriesOrder: 1,
    tags: ['typescript', 'types'],
    readingTimeMinutes: 8,
    publishedAt: daysAgo(60),
    excerpt:
      'Mapped types let you create new types by iterating over the keys of an existing type. Once you understand them, a huge swath of the standard library suddenly makes sense.',
    content: `## What Are Mapped Types?

Mapped types are one of TypeScript's most powerful features. They allow you to create a new type by transforming each property of an existing type.

The canonical example is \`Readonly<T>\`:

\`\`\`ts
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};
\`\`\`

The \`[K in keyof T]\` syntax iterates over every key of \`T\`, and we can apply modifiers or change the value type however we like.

## Practical Examples

### Making all properties optional

\`\`\`ts
type Partial<T> = {
  [K in keyof T]?: T[K];
};
\`\`\`

### Remapping keys with \`as\`

TypeScript 4.1 added the ability to remap keys using \`as\`:

\`\`\`ts
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};
\`\`\`

This transforms \`{ name: string }\` into \`{ getName: () => string }\`.

## When to Use Them

Mapped types shine when you need to derive a type from another without repeating yourself — utility types, API response transformations, and validation schemas are all excellent candidates.
`,
  },
  {
    id: 'post-ts-02',
    slug: 'conditional-types-the-complete-guide',
    title: 'Conditional Types: The Complete Guide',
    subtitle: 'Branch your type-level logic the way you branch runtime logic',
    status: 'published',
    seriesId: 'series-ts-deep-dives',
    seriesOrder: 2,
    tags: ['typescript', 'types', 'advanced'],
    readingTimeMinutes: 12,
    publishedAt: daysAgo(45),
    excerpt:
      'Conditional types bring if/else logic to the type level. Combined with infer, they unlock patterns that were impossible to express before TypeScript 2.8.',
    content: `## The Basics

A conditional type takes the form:

\`\`\`ts
T extends U ? X : Y
\`\`\`

If \`T\` is assignable to \`U\`, the type resolves to \`X\`; otherwise \`Y\`.

\`\`\`ts
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>;  // true
type B = IsString<42>;       // false
\`\`\`

## The \`infer\` Keyword

\`infer\` lets you capture a type variable within a conditional type's \`extends\` clause:

\`\`\`ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
\`\`\`

Here, \`R\` is inferred as the return type of the function \`T\`.

## Distributive Conditional Types

When the checked type is a naked type parameter, conditional types distribute over unions:

\`\`\`ts
type ToArray<T> = T extends any ? T[] : never;

type Arr = ToArray<string | number>;  // string[] | number[]
\`\`\`

Wrapping in a tuple prevents distribution: \`[T] extends [any]\`.

## Real-World Use Cases

- Extracting the resolved value of a Promise
- Building discriminated union helpers
- Filtering union members by shape
`,
  },
  {
    id: 'post-ts-03',
    slug: 'template-literal-types-and-string-manipulation',
    title: 'Template Literal Types and String Manipulation',
    subtitle: 'Type-safe string patterns without runtime overhead',
    status: 'published',
    seriesId: 'series-ts-deep-dives',
    seriesOrder: 3,
    tags: ['typescript', 'types', 'strings'],
    readingTimeMinutes: 7,
    publishedAt: daysAgo(30),
    excerpt:
      'Template literal types, introduced in TypeScript 4.1, let you construct string union types from other string types — enabling a whole new class of type-safe APIs.',
    content: `## Template Literal Types

Just like JavaScript template literals, TypeScript template literal types use backtick syntax:

\`\`\`ts
type Greeting = \`Hello, \${string}\`;

const a: Greeting = 'Hello, World';  // ✓
const b: Greeting = 'Goodbye';       // ✗
\`\`\`

## Combining with Unions

When a template literal type contains a union, TypeScript expands it into every combination:

\`\`\`ts
type Direction = 'left' | 'right' | 'top' | 'bottom';
type CSSProperty = \`padding-\${Direction}\`;
// "padding-left" | "padding-right" | "padding-top" | "padding-bottom"
\`\`\`

## Built-in String Manipulation Types

TypeScript ships four intrinsic types:
- \`Uppercase<S>\`
- \`Lowercase<S>\`
- \`Capitalize<S>\`
- \`Uncapitalize<S>\`

\`\`\`ts
type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type ClickHandler = EventName<'click'>;  // "onClick"
\`\`\`

## Practical Pattern: Type-safe Event Emitter Keys

\`\`\`ts
type EventMap = { click: MouseEvent; keydown: KeyboardEvent };
type HandlerMap = {
  [K in keyof EventMap as \`on\${Capitalize<K & string>}\`]: (e: EventMap[K]) => void;
};
// { onClick: (e: MouseEvent) => void; onKeydown: (e: KeyboardEvent) => void }
\`\`\`
`,
  },

  // ── Angular Patterns (1 published, 1 draft) ──────────────────────────────
  {
    id: 'post-ng-01',
    slug: 'angular-signals-practical-introduction',
    title: 'Angular Signals: A Practical Introduction',
    subtitle: 'Fine-grained reactivity without RxJS boilerplate',
    status: 'published',
    seriesId: 'series-angular-patterns',
    seriesOrder: 1,
    tags: ['angular', 'signals', 'reactivity'],
    readingTimeMinutes: 10,
    publishedAt: daysAgo(20),
    excerpt:
      "Angular's new Signals API offers a simpler mental model for state and derived values. Here's what you need to know to start using them in production today.",
    content: `## Why Signals?

Angular's change detection has always worked but was never the easiest concept to explain to new developers. Zone.js patches browser APIs to trigger change detection automatically, which works great until you need fine-grained control.

Signals solve this by making state *observable by default* at a granular level.

## The Three Primitives

\`\`\`ts
import { signal, computed, effect } from '@angular/core';

const count = signal(0);                         // writable
const doubled = computed(() => count() * 2);     // derived, read-only
effect(() => console.log('count is', count()));  // side-effect
\`\`\`

## Reading and Writing

\`\`\`ts
count();         // read: 0
count.set(5);    // set to 5
count.update(n => n + 1);  // update: 6
\`\`\`

## Signals in Components

\`\`\`ts
@Component({
  template: '<p>{{ count() }} × 2 = {{ doubled() }}</p>',
})
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  increment() { this.count.update(n => n + 1); }
}
\`\`\`

## When to Use Signals vs. RxJS

- **Signals**: local component state, derived values, simple async via \`toSignal()\`
- **RxJS**: complex async orchestration, HTTP, stream composition

They compose well together — \`toSignal()\` and \`toObservable()\` bridge the two worlds.
`,
  },
  {
    id: 'post-ng-02',
    slug: 'standalone-components-migration-guide',
    title: 'Standalone Components: A Migration Guide',
    subtitle: 'Step-by-step: ditching NgModule without breaking your app',
    status: 'draft',
    seriesId: 'series-angular-patterns',
    seriesOrder: 2,
    tags: ['angular', 'standalone', 'migration'],
    readingTimeMinutes: 14,
    publishedAt: daysAgo(1),
    excerpt:
      'NgModule served Angular well for years, but standalone components are now the recommended default. This guide walks through migrating a real app incrementally.',
    content: `## The Case for Going Standalone

NgModules added boilerplate without adding much value for most apps. Standalone components declare their own dependencies, making each component self-contained and easier to reason about.

## The Angular Migration Schematic

Angular provides a schematic that handles the mechanical parts:

\`\`\`bash
ng generate @angular/core:standalone
\`\`\`

Run it three times (the schematic prompts you):
1. Convert components, directives, and pipes
2. Remove unnecessary NgModules
3. Bootstrap with \`bootstrapApplication\`

## Manual Migration Pattern

For components that need careful attention:

\`\`\`ts
// Before
@NgModule({
  declarations: [MyComponent],
  imports: [CommonModule, RouterModule],
})
export class MyModule {}

// After
@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: '...',
})
export class MyComponent {}
\`\`\`

## Gotchas to Watch For

- **Shared directives**: each standalone component must import them individually
- **Lazy routes**: use \`loadComponent\` instead of \`loadChildren\` where possible
- **Testing**: \`TestBed.configureTestingModule\` still works; add imports directly

## Incremental Strategy

You don't have to do it all at once. Mark leaf components standalone first, then work up the tree. Modules and standalone components interoperate cleanly during migration.
`,
  },

  // ── Firebase & Firestore (2 published) ───────────────────────────────────
  {
    id: 'post-fb-01',
    slug: 'firestore-data-modeling-for-relational-thinkers',
    title: 'Firestore Data Modeling for Relational Thinkers',
    subtitle: 'How to stop fighting NoSQL and start working with it',
    status: 'published',
    seriesId: 'series-firebase-firestore',
    seriesOrder: 1,
    tags: ['firebase', 'firestore', 'data-modeling'],
    readingTimeMinutes: 11,
    publishedAt: daysAgo(50),
    excerpt:
      'If you come from a SQL background, Firestore feels inside-out. This guide reframes the core concepts so you can model data the way Firestore wants — not the way PostgreSQL does.',
    content: `## The Core Shift

In relational databases you model your *data*, then write queries to serve your UI. In Firestore you model your *queries* and design your data to match.

This isn't a limitation — it's a feature. Your data shape encodes your access patterns, which keeps reads fast and predictable.

## Collections, Documents, Subcollections

\`\`\`
users/{uid}
  name: string
  email: string
  posts/{postId}          ← subcollection
    title: string
    publishedAt: Timestamp
\`\`\`

Subcollections keep related data together but don't load child documents when you read the parent.

## Denormalization Is Normal

Don't fear duplicated data. If your post-list view needs the author's name and avatar, store them on the post document alongside the \`authorId\`.

\`\`\`ts
{
  title: 'Hello World',
  authorId: 'user-abc',
  authorName: 'Alex Rivera',     // denormalized
  authorPhotoUrl: 'https://...'  // denormalized
}
\`\`\`

Update both places when the author changes — this is a small price for fast, cheap list reads.

## Security Rules as Schema

Unlike SQL, Firestore has no schema enforcement at the database layer. Firestore Security Rules are your schema:

\`\`\`js
match /posts/{postId} {
  allow write: if request.resource.data.keys().hasAll(['title', 'authorId', 'status']);
}
\`\`\`

## Pagination Pattern

Always paginate with \`startAfter\` + a cursor document, not integer offsets:

\`\`\`ts
const q = query(
  collection(db, 'posts'),
  where('status', '==', 'published'),
  orderBy('publishedAt', 'desc'),
  startAfter(lastVisible),
  limit(10),
);
\`\`\`
`,
  },
  {
    id: 'post-fb-02',
    slug: 'firebase-security-rules-that-dont-suck',
    title: 'Firebase Security Rules That Don\'t Suck',
    subtitle: 'Write rules you can read, test, and actually trust',
    status: 'published',
    seriesId: 'series-firebase-firestore',
    seriesOrder: 2,
    tags: ['firebase', 'security', 'firestore'],
    readingTimeMinutes: 9,
    publishedAt: daysAgo(35),
    excerpt:
      'Security rules are the last line of defence between your Firestore data and the internet. Here\'s how to write rules that are maintainable, testable, and genuinely secure.',
    content: `## Start With the Principle of Least Privilege

Default to \`allow read, write: if false;\` and open up only what you need.

\`\`\`js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // deny everything by default
    }
    match /posts/{postId} {
      allow read: if resource.data.status == 'published';
      allow write: if request.auth != null && isOwner(postId);
    }
  }
}
\`\`\`

## Helper Functions Keep Rules DRY

Extract reusable predicates into functions:

\`\`\`js
function isSignedIn() {
  return request.auth != null;
}

function isOwner(uid) {
  return isSignedIn() && request.auth.uid == uid;
}

function isValidPost() {
  return request.resource.data.keys().hasAll(['title', 'status', 'authorId'])
    && request.resource.data.title is string
    && request.resource.data.title.size() > 0;
}
\`\`\`

## The Emulator Is Your Best Friend

Never write rules without the emulator. The Rules Unit Testing library lets you write Jest/Mocha tests against your rules:

\`\`\`ts
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

it('allows reading published posts', async () => {
  await assertSucceeds(get(db, 'posts/published-post'));
});

it('denies reading draft posts', async () => {
  await assertFails(get(db, 'posts/draft-post'));
});
\`\`\`

## Avoid \`get()\` in Hot Paths

Cross-document reads in rules (\`get()\`) count against your quota. Cache tenant ownership in custom claims if you have high read volume.
`,
  },

  // ── Design Systems (1 published, 1 draft) ────────────────────────────────
  {
    id: 'post-ds-01',
    slug: 'design-tokens-the-foundation-of-every-design-system',
    title: 'Design Tokens: The Foundation of Every Design System',
    subtitle: 'Why a shared vocabulary of values matters more than components',
    status: 'published',
    seriesId: 'series-design-systems',
    seriesOrder: 1,
    tags: ['design-systems', 'css', 'tokens'],
    readingTimeMinutes: 8,
    publishedAt: daysAgo(40),
    excerpt:
      'Before you build a single component, you need tokens. Design tokens are the named, platform-agnostic values that make consistency possible across every surface of your product.',
    content: `## What Are Design Tokens?

Design tokens are named design decisions. Instead of hardcoding \`#3B82F6\` throughout your codebase, you define:

\`\`\`json
{
  "color": {
    "brand": {
      "primary": { "value": "#3B82F6" }
    }
  }
}
\`\`\`

Now \`color.brand.primary\` is a contract between design and engineering.

## The Three Tiers

Most mature token systems have three tiers:

1. **Global tokens** — raw values (\`blue-500: #3B82F6\`)
2. **Semantic tokens** — intent-mapped (\`color-action-default: {blue-500}\`)
3. **Component tokens** — scoped to a component (\`button-background: {color-action-default}\`)

This separation means you can retheme an entire product by changing semantic tokens without touching components.

## CSS Custom Properties Are the Runtime Layer

\`\`\`css
:root {
  --color-brand-primary: #3B82F6;
  --color-action-default: var(--color-brand-primary);
}

.button {
  background-color: var(--color-action-default);
}
\`\`\`

Dark mode becomes a second rule set that overrides the semantic layer:

\`\`\`css
@media (prefers-color-scheme: dark) {
  :root {
    --color-brand-primary: #60A5FA;
  }
}
\`\`\`

## Tools Worth Knowing

- **Style Dictionary** — transforms tokens to any platform target
- **Theo** — Salesforce's token transformer
- **Tokens Studio** (Figma plugin) — bridges design and code
`,
  },
  {
    id: 'post-ds-02',
    slug: 'component-api-design-the-hard-parts',
    title: 'Component API Design: The Hard Parts',
    subtitle: 'Naming, composition, and the decisions you\'ll live with forever',
    status: 'draft',
    seriesId: 'series-design-systems',
    seriesOrder: 2,
    tags: ['design-systems', 'components', 'api-design'],
    readingTimeMinutes: 13,
    publishedAt: daysAgo(2),
    excerpt:
      'Component APIs are public contracts. Getting them right the first time is hard — getting them wrong means years of awkward deprecation cycles. Here\'s how to think through the decisions that matter.',
    content: `## The API Is the Product

Nobody cares how your component is implemented internally. They care about the props/inputs they have to learn, the events they have to handle, and the edge cases they have to worry about.

The API *is* the product.

## Composition Over Configuration

A button with twenty boolean props is a button nobody wants to use:

\`\`\`ts
// ✗ Too many props
<Button
  isLoading={true}
  isDisabled={false}
  hasLeadingIcon={true}
  iconName="arrow-right"
  size="large"
  variant="primary"
/>

// ✓ Composable
<Button size="large" variant="primary" disabled>
  Continue <ArrowRightIcon slot="end" />
</Button>
\`\`\`

## Consistent Naming Patterns

Pick a convention and never deviate:

| Pattern | Example |
|---------|---------|
| Boolean inputs | \`disabled\`, \`loading\` (not \`isDisabled\`, \`isLoading\`) |
| Event outputs | \`(click)\`, \`(change)\` — not \`(buttonClick)\` |
| Slot names | \`start\`, \`end\`, \`label\` — not \`prefix\`, \`suffix\`, \`content\` |

## Escape Hatches

Every component should have a way to break out:

- A \`class\` or \`className\` input for extra styles
- A wrapper element that can be \`ng-container\` / \`slot\`
- A way to pass arbitrary attributes through to the host element

Without escape hatches, consumers work around your component instead of with it.
`,
  },

  // ── Career & Growth (1 published) ────────────────────────────────────────
  {
    id: 'post-cg-01',
    slug: 'the-staff-engineer-job-description-nobody-writes',
    title: 'The Staff Engineer Job Description Nobody Writes',
    subtitle: 'What the role actually requires versus what the posting says',
    status: 'published',
    seriesId: 'series-career-growth',
    seriesOrder: 1,
    tags: ['career', 'staff-engineer', 'leadership'],
    readingTimeMinutes: 9,
    publishedAt: daysAgo(25),
    excerpt:
      'Staff engineer job postings list technical skills. But the job is 60% influence, communication, and knowing which problems to leave unsolved. Here\'s what I wish someone had told me.',
    content: `## What the Posting Says

- 8+ years of experience
- Deep expertise in distributed systems
- Strong coding skills (obviously)
- "Excellent communication"

## What the Job Actually Is

**Identifying the right problems.** Senior engineers solve the problems in front of them. Staff engineers ask whether those are the right problems to solve at all.

**Making decisions that stick.** Architectural decisions are only as good as their adoption. You can write the best RFC in history; if teams don't follow it, nothing changed.

**Multiplication, not addition.** Your job is to make everyone around you faster and better. Writing code is how you stay sharp and maintain credibility. It's not your primary output.

**Navigating ambiguity.** Nobody will hand you a ticket. You find the work, scope it, convince stakeholders it matters, and then do it — often across teams that don't report to you.

## The Communication Gap

Most technical people underestimate how much communication the role requires. You'll spend more time in documents, 1:1s, and cross-team syncs than you expect.

The good news: **technical depth is your credibility**. You need it to be heard, even if writing code isn't your main job anymore.

## Getting There

1. Start writing. RFCs, post-mortems, architecture docs. Get comfortable with written communication.
2. Mentor explicitly. Don't just pair-program — actively teach. It develops the "multiplier" instinct.
3. Work on things that matter to the org, not just your team.
4. Find a sponsor, not just a mentor. Someone who will say your name in rooms you're not in.
`,
  },

  // ── Standalone posts (no series) ─────────────────────────────────────────
  {
    id: 'post-standalone-01',
    slug: 'why-i-switched-from-jest-to-vitest',
    title: 'Why I Switched from Jest to Vitest',
    subtitle: 'Faster feedback, better ESM support, and a surprisingly smooth migration',
    status: 'published',
    seriesId: 'series-engineering-dx',
    seriesOrder: 1,
    tags: ['testing', 'vitest', 'jest', 'dx'],
    readingTimeMinutes: 6,
    publishedAt: daysAgo(15),
    excerpt:
      'After years with Jest I finally made the switch to Vitest. The migration took an afternoon and my test suite now runs twice as fast. Here\'s what changed and what didn\'t.',
    content: `## The Problem with Jest in 2024

Jest is battle-tested and I have no complaints about it as a test runner. But in a modern ESM-first codebase it increasingly feels like you're fighting the toolchain:

- Native ESM support requires \`--experimental-vm-modules\` and careful config
- Transforms add overhead to cold starts
- Config sprawl (\`jest.config.js\`, \`babel.config.js\`, transform mappings)

## Enter Vitest

Vitest uses Vite under the hood, which means:

- **Native ESM** — no transform step for modern code
- **Watch mode** that only reruns affected tests
- **API compatibility** — if you use Jest's API, you're already writing Vitest

\`\`\`ts
// This is valid Vitest. It's also valid Jest.
import { describe, it, expect } from 'vitest';

describe('add', () => {
  it('returns the sum', () => {
    expect(1 + 1).toBe(2);
  });
});
\`\`\`

## Migration Steps

1. \`npm install -D vitest\`
2. Add a \`vitest.config.ts\` (often just \`export default defineConfig({})\`)
3. Replace \`jest\` with \`vitest\` in \`package.json\` scripts
4. Fix any \`jest.mock\` calls that need updating (most don't)
5. Enjoy the speed

## Caveats

Vitest's watch mode and UI are genuinely better. The coverage provider (\`@vitest/coverage-v8\`) is fast but not quite at Istanbul's maturity. Worth it for most projects.
`,
  },
  {
    id: 'post-standalone-02',
    slug: 'monorepo-or-not-a-pragmatic-guide',
    title: 'Monorepo or Not? A Pragmatic Guide',
    subtitle: 'Skip the ideology and focus on your actual constraints',
    status: 'published',
    seriesId: undefined,
    tags: ['monorepo', 'architecture', 'dx'],
    readingTimeMinutes: 7,
    publishedAt: daysAgo(55),
    excerpt:
      'The monorepo debate generates more heat than light. This post cuts through the ideology and gives you a decision framework based on team size, deployment frequency, and code sharing needs.',
    content: `## The Case For

**Atomic changes across packages.** When you update a shared interface, you update all consumers in the same commit. No version mismatches, no coordination lag.

**Shared tooling.** One \`tsconfig.base.json\`, one lint config, one CI pipeline. Onboarding is consistent across every project.

**Easy refactoring.** Moving a function from one package to another is a file move, not a cross-repo PR.

## The Case Against

**Build complexity.** You need Nx, Turborepo, Bazel, or similar to avoid rebuilding everything on every change. This is learnable but not free.

**Noisy CI.** Pull requests touch unrelated packages. You need affected-change detection to keep CI fast.

**Access control.** GitHub doesn't give you per-directory branch protection without workarounds.

## The Decision Framework

| Situation | Recommendation |
|-----------|---------------|
| Solo developer or tiny team | Monorepo — simplicity wins |
| Tight coupling across projects | Monorepo |
| Independent deployment cadences | Separate repos |
| Different tech stacks | Separate repos |
| Shared component library + consumers | Monorepo with Nx |

## My Take

For most product teams under 50 engineers: monorepo. The coordination overhead of polyrepo at that scale is consistently underestimated.
`,
  },
  {
    id: 'post-standalone-03',
    slug: 'the-underrated-art-of-the-code-review',
    title: 'The Underrated Art of the Code Review',
    subtitle: 'How to give feedback that actually improves the code and the team',
    status: 'published',
    seriesId: undefined,
    tags: ['process', 'code-review', 'team'],
    readingTimeMinutes: 5,
    publishedAt: daysAgo(70),
    excerpt:
      "Most code review feedback focuses on what's wrong. The best reviewers focus on why it matters and how to make it better — while making the author feel like a collaborator, not a defendant.",
    content: `## The Review Is a Conversation

Treat every comment as the start of a dialogue, not a verdict. Questions often work better than statements:

- ✗ "This is wrong."
- ✓ "I'm not sure this handles the empty array case — what do you think?"

## The Nit Tax

Small stylistic comments have a cost. If a linter can enforce it, don't mention it in review. If you leave five nits alongside one real issue, the real issue gets lost.

Be selective. Ask yourself: *would this comment matter in six months?*

## Praise the Good Parts

Genuinely great code deserves recognition. Praise specific, concrete things:

- "Nice use of \`reduce\` here — much cleaner than the loop would have been."
- "Good catch on the race condition. I wouldn't have spotted that."

This builds the relationship and signals you're reading carefully, not just hunting for problems.

## The Three Buckets

Label your comments by importance:

- **Must change** — correctness, security, performance
- **Should discuss** — architecture, significant tradeoffs
- **Nit** — optional style preferences

This lets the author prioritize and makes your approval decision clear.

## Timing

Review within 24 hours or let the author know when to expect feedback. Nothing kills flow like a PR sitting for days.
`,
  },
  {
    id: 'post-standalone-04',
    slug: 'what-nobody-tells-you-about-going-remote',
    title: 'What Nobody Tells You About Going Remote',
    subtitle: 'The good parts, the hard parts, and what actually makes it work',
    status: 'draft',
    seriesId: 'series-career-growth',
    seriesOrder: 2,
    tags: ['remote', 'career', 'work-life'],
    readingTimeMinutes: 6,
    publishedAt: daysAgo(3),
    excerpt:
      'Three years into remote work, the things that seemed like advantages have nuance, and the things I thought would be problems turned out not to be. Here\'s what I actually found.',
    content: `## What Surprised Me (Good)

**Deep work is real.** Without open-plan office interruptions, I get into flow more often and for longer. My best work happens in the late morning when I'm home, caffeine in hand, and nobody needs anything.

**Autonomy compounds.** When you're remote, you're judged on output, not presence. This aligns incentives correctly and forces you to communicate intent clearly.

**The commute time goes somewhere useful.** Mine went into exercise and cooking. Both made me meaningfully healthier.

## What's Actually Hard

**Asynchronous communication is a skill, not a default.** Writing clearly and completely — anticipating follow-up questions, providing context — takes real effort. Most people aren't good at it yet.

**Loneliness isn't about the number of video calls.** It's about the casual, unstructured interaction that video calls don't replicate well. This requires intentional investment in community.

**Career visibility is genuinely harder.** Out of sight means you have to work harder to ensure the right people know what you're shipping.

## What Actually Makes It Work

1. A dedicated workspace with a door
2. Strong async writing habits
3. At least one in-person team event per year
4. Explicit over-communication about what you're working on and why

Remote work isn't better or worse than in-office. It's different, and the people who thrive in it are the ones who adapt to the difference rather than fighting it.
`,
  },
  {
    id: 'post-standalone-05',
    slug: 'git-tips-i-wish-i-knew-earlier',
    title: 'Git Tips I Wish I Knew Earlier',
    subtitle: 'The commands and workflows that make daily Git use less painful',
    status: 'draft',
    seriesId: 'series-engineering-dx',
    seriesOrder: 2,
    tags: ['git', 'dx', 'tooling'],
    readingTimeMinutes: 5,
    publishedAt: daysAgo(4),
    excerpt:
      'Git is the tool I use most hours of every day and I spent years using maybe 10% of it. These are the commands and patterns that made the biggest difference.',
    content: `## \`git worktree\` Is Underrated

Working on two branches simultaneously usually means stashing or context-switching. Worktrees let you check out multiple branches into separate directories at the same time:

\`\`\`bash
git worktree add ../my-feature feature/my-feature
\`\`\`

Now \`../my-feature\` has the feature branch checked out independently.

## Fixup Commits + Autosquash

Instead of \`git commit --amend\` (which rewrites history you've shared), use fixup commits:

\`\`\`bash
git commit --fixup HEAD~2   # marks commit to be squashed into HEAD~2
git rebase -i --autosquash HEAD~3  # squashes automatically
\`\`\`

## Interactive Rebase for Clean History

Before merging, clean up your branch:

\`\`\`bash
git rebase -i origin/main
\`\`\`

\`pick\`, \`reword\`, \`squash\`, \`fixup\`, \`drop\` — five commands that give you a clean, readable history.

## \`git log\` Aliases Worth Having

\`\`\`bash
git config --global alias.lg "log --oneline --graph --decorate"
\`\`\`

## \`git bisect\` Finds Bugs Fast

Binary-search your history to find which commit introduced a bug:

\`\`\`bash
git bisect start
git bisect bad            # current commit is broken
git bisect good v1.2.0    # this tag was fine
# Git checks out midpoints; you run your test and mark good/bad
git bisect run npm test   # fully automated
\`\`\`
`,
  },
];

async function seedPosts(batch: WriteBatch): Promise<void> {
  console.log(`[seed:full-monty] Writing ${POSTS.length} posts...`);
  for (const p of POSTS) {
    const ref = tenantCol('posts').doc(p.id);
    batch.set(ref, {
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle ?? null,
      status: p.status,
      content: p.content,
      excerpt: p.excerpt,
      tags: p.tags,
      seriesId: p.seriesId ?? null,
      seriesOrder: p.seriesOrder ?? null,
      thumbnailUrl: `https://picsum.photos/seed/${p.id}/1200/630`,
      thumbnailAlt: p.title,
      authorId: AUTHOR_ID,
      readingTimeMinutes: p.readingTimeMinutes,
      embeddedMedia: {},
      seo: {
        title: p.title,
        description: p.excerpt,
      },
      publishedAt: p.publishedAt,
      updatedAt: p.publishedAt,
      createdAt: p.publishedAt,
    });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  try {
    await seedAuth();
    await seedTenant();
    await seedSiteConfig();
    await seedAuthor();

    const db = getFirestore();
    const batch = db.batch();
    await seedSeries(batch);
    await seedPosts(batch);
    await batch.commit();
    console.log('[seed:full-monty] Batch committed (series + posts).');

    console.log('[seed:full-monty] Done.');
  } catch (err) {
    console.error('[seed:full-monty] Error:', err);
    process.exit(1);
  }
}

seed();
