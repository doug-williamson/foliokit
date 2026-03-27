# Stark Industries Lab Notes — FolioKit Demo

A full-featured demo of the FolioKit CMS library suite, themed as Tony Stark's
engineering journal. This project validates the complete consumer experience:
library installation, provider wiring, shell layout, routing, content pages,
and design token customization.

## Prerequisites

- **Node.js** 22+ (LTS)
- The FolioKit monorepo libraries must be built first (see below)

## Quick start

From the **monorepo root** (`/foliokit`):

```bash
# 1. Build the libraries to dist/
npx nx run-many --target=build --projects=cms-core,cms-ui,cms-markdown

# 2. Install the demo's dependencies
cd demo
npm install --legacy-peer-deps

# 3. Start the dev server
./node_modules/.bin/ng serve
```

Open [http://localhost:4200](http://localhost:4200).

## Production build

```bash
./node_modules/.bin/ng build --configuration=production
```

Output lands in `demo/dist/stark-demo/`.

## What this demo validates

| Feature | Where |
|---------|-------|
| `provideFolioKit()` single-call bootstrap | `src/app/app.config.ts` |
| `AppShellComponent` with sidenav + theme toggle | `src/app/app.ts` |
| `SHELL_CONFIG` token | `src/app/app.config.ts` |
| `AboutPageComponent` (from `@foliokit/cms-ui`) | `/about` route |
| `LinksPageComponent` (from `@foliokit/cms-ui`) | `/links` route |
| `MarkdownComponent` (from `@foliokit/cms-markdown`) | `/blog/:slug` route |
| Design token import (`tokens.css`) | `angular.json` styles array |
| **Custom token overrides** | `src/styles.scss` — arc reactor cyan on logo dot |
| Static seed data (no Firestore) | `src/app/data/seed-posts.ts` |
| Route resolvers | `src/app/resolvers/` |

## Customizing design tokens

FolioKit's design system uses CSS custom properties. Override them in your
global stylesheet after importing `tokens.css`:

```scss
// In styles.scss — after @include mat.theme(...)
[data-theme="light"] {
  --logo-dot: #FF6B35;   // your brand colour
  --btn-primary-bg: #FF6B35;
}
```

This demo overrides `--logo-dot` and `--focus-ring` to an arc-reactor cyan
(`#00D4FF`) to demonstrate the mechanism. See `src/styles.scss` for the full
override set.

## Project structure

```
demo/
├── src/app/
│   ├── data/             # Static seed data (posts, page configs)
│   ├── resolvers/        # Route resolvers returning seed data
│   ├── features/
│   │   ├── home/         # Hero landing page
│   │   ├── post-list/    # Blog post listing
│   │   └── post-detail/  # Full post with markdown rendering
│   ├── app.config.ts     # Provider setup (provideFolioKit, SHELL_CONFIG)
│   ├── app.routes.ts     # Route definitions
│   └── app.ts            # Root component (AppShellComponent wrapper)
├── angular.json          # Build config with tokens.css and budgets
└── package.json          # Dependencies via file: paths to ../dist/libs/
```
