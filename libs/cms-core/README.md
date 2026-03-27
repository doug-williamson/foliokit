# @foliokit/cms-core

Core Firebase services, data models, and injection tokens for the FolioKit CMS.
Provides `provideFolioKit()` — the single-call bootstrapper that sets up Firebase
(Firestore, Storage, Auth) and default service bindings for Angular applications.

Part of the [FolioKit](https://github.com/doug-williamson/foliokit) ecosystem.

## Install

```bash
npm install @foliokit/cms-core
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@angular/common` | `^21.2.4` |
| `@angular/core` | `^21.2.4` |
| `firebase` | `^11.10.0` |
| `rxjs` | `~7.8.0` |

## Quick Start

```typescript
// app.config.ts
import { provideFolioKit } from '@foliokit/cms-core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFolioKit({
      firebaseConfig: {
        apiKey: '...',
        authDomain: '...',
        projectId: '...',
        storageBucket: '...',
        messagingSenderId: '...',
        appId: '...',
      },
    }),
  ],
};
```

`provideFolioKit()` registers:
- Firebase App, Firestore, Storage, and Auth (SSR-safe — returns `null` on the server)
- `PostService` bound to `BLOG_POST_SERVICE`
- `SiteConfigService` bound to `SITE_CONFIG_SERVICE`
- Optional `SITE_ID` token (when `siteId` is provided)

## What's Included

- **`provideFolioKit(config)`** — single-call bootstrapper
- **`provideFirebase(options, useEmulator)`** — lower-level Firebase-only setup
- **Data models** — `BlogPost`, `SiteConfig`, `NavItem`, `Author`, `Tag`, `SeoMeta`, `AboutPageConfig`, `LinksPageConfig`, `HomePageConfig`
- **Services** — `PostService`, `SiteConfigService`, `AuthorService`, `AuthService`, `TagService`
- **DI tokens** — `BLOG_POST_SERVICE`, `SITE_CONFIG_SERVICE`, `SITE_ID`, `FIREBASE_OPTIONS`, `FIRESTORE`, `FIREBASE_STORAGE`, `FIREBASE_AUTH`
- **Pipes** — `TagLabelPipe`

## Full Documentation

[foliokitcms.com/docs/getting-started](https://foliokitcms.com/docs/getting-started)
