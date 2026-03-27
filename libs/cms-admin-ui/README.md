# @foliokit/cms-admin-ui

## ⚠️ Pre-release

This package is pre-release (`0.x`). The API is unstable and may change without
notice between minor versions. Do not depend on it in production applications.

---

Admin UI editor components for the FolioKit CMS. Provides ngrx signal stores
and standalone Angular components for managing posts, authors, site config,
and media uploads.

Part of the [FolioKit](https://github.com/doug-williamson/foliokit) ecosystem.

## Install

```bash
npm install @foliokit/cms-admin-ui@next
```

The `@next` tag ensures you get the latest pre-release version.

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@angular/cdk` | `^21.2.2` |
| `@angular/common` | `^21.2.4` |
| `@angular/core` | `^21.2.4` |
| `@angular/forms` | `^21.2.4` |
| `@angular/material` | `^21.2.2` |
| `@angular/router` | `^21.2.4` |
| `@foliokit/cms-core` | `^1.0.0` |
| `@ngrx/signals` | `^21.0.1` |
| `firebase` | `^11.10.0` |
| `rxjs` | `~7.8.0` |

## What's Included

**Signal Stores:**
- `PostEditorStore` / `PostsListStore` — post CRUD and list management
- `AuthorEditorStore` — author editing
- `SiteConfigEditorStore` — site configuration editing

**Components:**
- `PostsBoardComponent` — kanban-style post management
- `PostsListComponent` — table-based post management
- `PostEditorMediaTabComponent` — cover image and embedded media upload
- `LinksEditorFormComponent` — links page content editor

## Full Documentation

[foliokitcms.com/docs/getting-started](https://foliokitcms.com/docs/getting-started)
