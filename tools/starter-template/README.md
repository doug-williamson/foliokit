# FolioKit Blog Starter

A pre-wired Angular 21 blog application powered by [FolioKit CMS](https://foliokitcms.com). Clone, configure your Firebase project, and deploy.

## Getting Started

### 1. Clone or degit this template

```bash
npx degit foliokit/starter my-blog
cd my-blog
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase credentials

Edit `src/environments/environment.ts` and replace the placeholder values with your Firebase project credentials. You can find these in the [Firebase console](https://console.firebase.google.com) under **Project Settings > General**.

For production builds, either:
- Set `NG_APP_FIREBASE_*` environment variables in your CI/CD pipeline, or
- Hardcode the values directly in `src/environments/environment.prod.ts`

### 4. Set up Firebase config files

```bash
cp firebase.json.example firebase.json
cp .firebaserc.example .firebaserc
```

Edit both files and replace `<YOUR_PROJECT_ID>` with your Firebase project ID.

### 5. Authenticate with Firebase

```bash
firebase login
firebase use <your-project-id>
```

### 6. Local development

```bash
ng serve
```

### 7. Production build and deploy

```bash
ng build --configuration production
firebase deploy
```

## Firestore Prerequisites

Before the app will render content, your Firestore database must contain the following seed documents:

- **`/site-config/YOUR_SITE_ID`** — A `SiteConfig` document containing your site name, URL, navigation, default SEO settings, and page toggles (about, links).
- **`/authors/{authorId}`** — At least one author document with a display name and optional avatar URL.
- **`/posts/{postId}`** — At least one published post document with `status: 'published'`, a `slug`, `title`, `publishedAt` timestamp, and `authorId`.

Replace `YOUR_SITE_ID` in `src/app/app.config.ts` with the document ID you chose for your site-config document.

See the [FolioKit documentation](https://foliokitcms.com) for full schema details and examples.

## Project Structure

```
src/
  app/
    app.component.ts       — Root component with shell and navigation
    app.component.html      — Shell template
    app.config.ts           — Client application config (providesFolioKit)
    app.config.server.ts    — Server application config (SSR)
    app.routes.ts           — Client routes (FOLIO_BLOG_ROUTES)
    app.routes.server.ts    — Server route render modes
  environments/
    environment.ts          — Development Firebase config
    environment.prod.ts     — Production Firebase config (env vars)
  main.ts                   — Browser bootstrap
  main.server.ts            — Server bootstrap
  server.ts                 — Express SSR server
  styles.scss               — Global styles (Tailwind + FolioKit theme)
```

## Run `firebase login` and `firebase use <project-id>` before `ng serve`.

## License

MIT
