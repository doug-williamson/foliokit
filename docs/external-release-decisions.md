# External Release Decisions

> Resolved 2026-03-27. Based on findings from `docs/api-audit.md` (Chunk A) and `smoke-test/FINDINGS.md` (Chunk B).
> Referenced by Chunk D for implementation.

---

## Decision 1 — Uncertain exports: public contract vs. internal

The API audit rated 64+ exports. Two were not rated **(A)**:

### `CmsAdminUi` — cms-admin-ui — rated **(B)**

**Verdict: Internal. Remove from public API.**

- Empty Nx generator scaffold: `selector: 'lib-cms-admin-ui'`, no template content, no imports, no logic.
- The `lib-` prefixed selector is the Nx default for auto-generated components — it was never customised.
- No consumer would use this. It has zero value as a public export.
- **Action:** Remove the `export * from './lib/cms-admin-ui/cms-admin-ui'` line from `libs/cms-admin-ui/src/index.ts`.

### `SITE_ID` — cms-core — rated **(C)**

**Verdict: Public contract. Promote to (A).**

- `provideFolioKit()` accepts `siteId` in `FolioKitConfig` and stores it as the `SITE_ID` injection token.
- `SiteConfigService.getSiteConfig(siteId)` already supports multi-site by accepting a site ID parameter.
- `SITE_ID` is the injection bridge that lets services resolve the active site without threading a parameter manually. Removing it would break the `siteId` parameter in `FolioKitConfig` — or at least leave it inert.
- The token has a clear consumer path: any service or guard that needs to know "which site am I" can `inject(SITE_ID, { optional: true })`.
- **Action:** Upgrade the rating in `api-audit.md` from **(C)** to **(A)**. Add a usage example to the JSDoc on the `SITE_ID` token. Remove the "candidate for removal" note.

---

## Decision 2 — `cms-admin-ui`: external offering or pre-release?

**Verdict: Explicitly pre-release.**

### Evidence

| Signal | Value |
|--------|-------|
| Package version | `0.1.0` — every other library is `1.0.0` |
| Scaffold leak | `CmsAdminUi` empty component still in exports |
| Audience | Admin-internal tooling (post editors, kanban boards, media upload) — not consumer-facing UI |
| Validation | API surface has not been tested by any external consumer |
| Build status | Functional — 18 clean exports, builds without errors |

### Treatment

1. The `0.x` semver range already communicates "breaking changes allowed" per npm convention. No version change needed.
2. Add a `## ⚠️ Pre-release` banner to `libs/cms-admin-ui/README.md`:
   > This package is pre-release (`0.x`). The API is unstable and may change without notice between minor versions. Do not depend on it in production applications.
3. Do **not** include `@foliokit/cms-admin-ui` in external getting-started documentation, README examples, or the smoke-test project.
4. The library remains published to npm (for internal and early-adopter use) but is not part of the stable external offering until it reaches `1.0.0`.

---

## Decision 3 — Iron Man / Tony Stark demo site configuration

A complete, type-safe demo `SiteConfig` for seeding a FolioKit showcase site. All values conform to the existing interfaces: `SiteConfig`, `ShellConfig`, `FolioKitConfig`, `HomePageConfig`, `AboutPageConfig`, `LinksPageConfig`, `Author`.

### Identity

| Field | Value |
|-------|-------|
| `siteName` | Stark Industries Lab Notes |
| `siteUrl` | `https://stark.foliokit.dev` |
| `description` | Engineering journal and project archive from Tony Stark. |
| `logo` | `null` — use the default FolioKit logo-mark ("F" + teal dot) in the shell |
| `favicon` | `null` — defer to default |
| `defaultAuthorId` | `tony-stark` |

### Palette

Use the existing teal + violet token palette without overrides:

- **Primary brand:** Teal (`--teal-500` #2A9797 / `--teal-400` #38B2AC) — arc reactor energy motif.
- **Accent flare:** Violet (`--violet-500` #6B46C1) — used sparingly, matches Angular's brand colour.
- **Neutrals:** Slate scale (cool blue-grey) for text and surfaces.
- **Dark mode:** Ships by default via `ThemeService` toggle. Light mode default.

No custom CSS overrides needed. The standard FolioKit design tokens are on-brand for a tech/engineering persona.

### Nav structure

```typescript
nav: [
  { label: 'Home',      url: '/',      order: 1 },
  { label: 'Lab Notes', url: '/posts', order: 2 },
  { label: 'About',     url: '/about', order: 3 },
  { label: 'Links',     url: '/links', order: 4 },
]
```

### ShellConfig (provided in `app.config.ts`)

```typescript
{
  appName: 'Stark Industries Lab Notes',
  showAuth: false,
  nav: [
    { label: 'Home',      url: '/',      order: 1 },
    { label: 'Lab Notes', url: '/posts', order: 2 },
    { label: 'About',     url: '/about', order: 3 },
    { label: 'Links',     url: '/links', order: 4 },
  ],
}
```

### FolioKitConfig (provided in `app.config.ts`)

```typescript
{
  firebaseConfig: {
    apiKey:            '<from-firebase-console>',
    authDomain:        'stark-foliokit.firebaseapp.com',
    projectId:         'stark-foliokit',
    storageBucket:     'stark-foliokit.appspot.com',
    messagingSenderId: '000000000000',
    appId:             '1:000000000000:web:0000000000000000',
  },
  siteId: 'stark',
}
```

### Home page (`SiteConfig.pages.home`)

```typescript
{
  enabled: true,
  heroHeadline: 'Stark Industries Lab Notes',
  heroSubheadline: 'Engineering journal. Arc reactor specs. Suit telemetry.',
  ctaLabel: 'Read the latest',
  ctaUrl: '/posts',
  showRecentPosts: true,
  seo: {
    title: 'Stark Industries Lab Notes',
    description: 'Engineering journal and project archive from Tony Stark.',
  },
}
```

### About page (`SiteConfig.pages.about`)

```typescript
{
  enabled: true,
  headline: 'Tony Stark',
  subheadline: 'Genius, billionaire, playboy, philanthropist.',
  bio: [
    '## Background',
    '',
    'MIT graduate at 17. Took over Stark Industries at 21.',
    'Pivoted the company from defence contracting to clean energy',
    'after a life-changing experience in Afghanistan.',
    '',
    '## Current work',
    '',
    '- **Arc Reactor** — miniaturised clean energy for buildings and vehicles',
    '- **Iron Man Program** — powered exoskeleton R&D (Mark L and beyond)',
    '- **Avengers Initiative** — founding member, tech lead',
    '- **Stark Relief Foundation** — disaster response and rebuilding',
    '',
    '> "Sometimes you gotta run before you can walk."',
  ].join('\n'),
  socialLinks: [
    { platform: 'github',   url: 'https://github.com/stark-industries' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/tonystark' },
    { platform: 'twitter',  url: 'https://x.com/tonystark' },
    { platform: 'website',  url: 'https://starkindustries.com' },
  ],
  seo: {
    title: 'About — Tony Stark',
    description: 'Genius, billionaire, playboy, philanthropist. Founder of Stark Industries.',
  },
}
```

### Links page (`SiteConfig.pages.links`)

```typescript
{
  enabled: true,
  headline: 'Tony Stark',
  bio: 'Links to my projects, talks, and ventures.',
  links: [
    { id: '1', label: 'Stark Industries',           url: 'https://starkindustries.com',                           highlighted: true,  order: 1 },
    { id: '2', label: 'Arc Reactor Specs (GitHub)',  url: 'https://github.com/stark-industries/arc-reactor',       platform: 'github',  order: 2 },
    { id: '3', label: 'MIT Commencement Talk',       url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',              platform: 'youtube', order: 3 },
    { id: '4', label: 'Avengers Initiative',         url: 'https://avengers.org',                                                      order: 4 },
    { id: '5', label: 'Stark Relief Foundation',     url: 'https://starkrelief.org',                                                   order: 5 },
  ],
  seo: {
    title: 'Links — Tony Stark',
    description: 'Projects, talks, and ventures from Tony Stark.',
  },
}
```

### Default author (`Author` model)

```typescript
{
  id: 'tony-stark',
  displayName: 'Tony Stark',
  bio: 'Founder of Stark Industries. Building the future, one suit at a time.',
  avatarUrl: '',   // placeholder — no real image in seed data
}
```

### Sample blog posts (for seeding)

Three posts to populate the "Lab Notes" section. The spread covers tag variety,
status differentiation (published vs. draft), and enough content range to
exercise both the post list and detail routes meaningfully:

1. **"Miniaturizing the Arc Reactor: An Engineering Retrospective"**
   - slug: `miniaturizing-arc-reactor`
   - tags: `['engineering', 'hardware']`
   - status: `'published'`
   - excerpt: "A technical deep-dive into three generations of arc reactor miniaturisation — from the cave prototype to the vibranium-core unit."
   - tone: Technical deep-dive. First-person engineering retrospective.

2. **"Why I Deprecated JARVIS and Rewrote in TypeScript"**
   - slug: `deprecated-jarvis-typescript`
   - tags: `['software', 'ai']`
   - status: `'published'`
   - excerpt: "JARVIS was a marvel of spaghetti Python. F.R.I.D.A.Y. is a clean-room rewrite in TypeScript with full type safety. Here's why the migration was worth it."
   - tone: Dev humor. Relatable engineering decision-making wrapped in Stark bravado.

3. **"Stark Industries' Approach to Zero-Downtime Deployments"**
   - slug: `zero-downtime-deployments`
   - tags: `['devops', 'infrastructure']`
   - status: `'draft'`
   - excerpt: "When your deployment target is a flying suit of armour, you cannot afford downtime. Our blue-green strategy for mission-critical firmware updates."
   - tone: Ops/infra angle. Serious engineering with a Stark lens.
