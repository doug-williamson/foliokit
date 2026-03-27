# FolioKit Public API Audit

> Generated 2026-03-27. Covers the four published libraries on `master`.

Legend: **(A)** clearly public contract, **(B)** probably internal / leaked, **(C)** uncertain.

---

## @foliokit/cms-core 1.0.0

Source: `libs/cms-core/src/index.ts`

### Injection Tokens & Providers

| Export | Kind | Rating | Notes |
|--------|------|--------|-------|
| `FIREBASE_OPTIONS` | `InjectionToken<FirebaseOptions>` | **(A)** | Firebase project config |
| `FIREBASE_APP` | `InjectionToken<FirebaseApp>` | **(A)** | Initialised Firebase app |
| `FIRESTORE` | `InjectionToken<Firestore \| null>` | **(A)** | Firestore instance |
| `FIREBASE_STORAGE` | `InjectionToken<FirebaseStorage \| null>` | **(A)** | Storage instance |
| `FIREBASE_AUTH` | `InjectionToken<Auth \| null>` | **(A)** | Auth instance |
| `ADMIN_EMAIL` | `InjectionToken<string>` | **(A)** | Admin email config |
| `provideFirebase()` | `() => EnvironmentProviders` | **(A)** | Standalone provider helper |

### Data Models

| Export | Kind | Rating |
|--------|------|--------|
| `BlogPost` | Interface | **(A)** |
| `SeoMeta` | Interface | **(A)** |
| `EmbeddedMediaEntry` | Interface | **(A)** |
| `SiteConfig` | Interface | **(A)** |
| `NavItem` | Interface | **(A)** |
| `SocialPlatform` | Type union | **(A)** |
| `SocialLink` | Interface | **(A)** |
| `AboutPageConfig` | Interface | **(A)** |
| `LinksPageConfig` | Interface | **(A)** |
| `HomePageConfig` | Interface | **(A)** |
| `LinksLink` | Interface | **(A)** |
| `Tag` | Interface | **(A)** |
| `Author` | Interface | **(A)** |

### Services

| Export | Kind | Rating |
|--------|------|--------|
| `AuthService` | `@Injectable` | **(A)** |
| `AuthorService` | `@Injectable` | **(A)** |
| `PostService` | `@Injectable` | **(A)** |
| `SiteConfigService` | `@Injectable` | **(A)** |
| `TagService` | `@Injectable` | **(A)** |

### Service Tokens (DI abstraction layer)

| Export | Kind | Rating |
|--------|------|--------|
| `IBlogPostService` | Interface | **(A)** |
| `BLOG_POST_SERVICE` | `InjectionToken<IBlogPostService>` | **(A)** |
| `POSTS_TRANSFER_KEY` | `StateKey<BlogPost[]>` | **(A)** |
| `ISiteConfigService` | Interface | **(A)** |
| `SITE_CONFIG_SERVICE` | `InjectionToken<ISiteConfigService>` | **(A)** |
| `ABOUT_CONFIG_TRANSFER_KEY` | `StateKey<AboutPageConfig \| null>` | **(A)** |

### Pipes

| Export | Kind | Rating |
|--------|------|--------|
| `TagLabelPipe` | `@Pipe` | **(A)** |

**Summary:** 32 exports, all **(A)**. Clean public surface. Note: `firebase-admin.ts` is intentionally excluded (server-only, imported directly in SSR files).

---

## @foliokit/cms-ui 1.0.0

Source: `libs/cms-ui/src/index.ts`

| Export | Kind | Rating | Notes |
|--------|------|--------|-------|
| `AppShellComponent` | `@Component` (standalone) | **(A)** | Main layout shell |
| `ShellNavFooterDirective` | `@Directive` (standalone) | **(A)** | Content projection slot |
| `ThemeService` | `@Injectable` | **(A)** | Light/dark theme switching |
| `ColorScheme` | Type (`'light' \| 'dark'`) | **(A)** | Theme type alias |
| `ShellConfig` | Interface | **(A)** | Shell configuration shape |
| `SHELL_CONFIG` | `InjectionToken<ShellConfig>` | **(A)** | Shell config provider |
| `AboutPageComponent` | `@Component` (standalone) | **(A)** | About page renderer |
| `LinksPageComponent` | `@Component` (standalone) | **(A)** | Links page renderer |
| `CMS_ROUTE_DATA_KEY` | `string` (`'page'`) | **(A)** | Route data key for LinksPage |
| `ABOUT_ROUTE_DATA_KEY` | `string` (`'about'`) | **(A)** | Route data key for AboutPage |
| `AboutPageRouteData` | Interface | **(A)** | Type-safe route data |
| `LinksPageRouteData` | Interface | **(A)** | Type-safe route data |

**Summary:** 12 exports, all **(A)**. Clean public surface.

---

## @foliokit/cms-markdown 1.0.0

Source: `libs/cms-markdown/src/index.ts`

| Export | Kind | Rating | Notes |
|--------|------|--------|-------|
| `MarkdownComponent` | `@Component` (standalone) | **(A)** | Markdown renderer with embedded media token resolution. Inputs: `content` (required), `embeddedMedia` (optional). |

**Summary:** 1 export, **(A)**. Minimal, focused surface.

---

## @foliokit/cms-admin-ui 0.1.0

Source: `libs/cms-admin-ui/src/index.ts`

### Stores

| Export | Kind | Rating |
|--------|------|--------|
| `AuthorEditorStore` | ngrx `signalStore` | **(A)** |
| `AuthorEditorState` | Interface | **(A)** |
| `SiteConfigEditorStore` | ngrx `signalStore` | **(A)** |
| `SiteConfigEditorState` | Interface | **(A)** |
| `PostEditorStore` | ngrx `signalStore` | **(A)** |
| `PostEditorState` | Interface | **(A)** |
| `PostsListStore` | ngrx `signalStore` | **(A)** |
| `PostsListState` | Interface | **(A)** |

### Components

| Export | Kind | Rating | Notes |
|--------|------|--------|-------|
| `LinksEditorFormComponent` | `@Component` (standalone) | **(A)** | Links page editor form |
| `PostEditorMediaTabComponent` | `@Component` (standalone) | **(A)** | Cover image & media upload tab |
| `PostEditorCoverImageComponent` | `@Component` (standalone) | **(A)** | Cover image upload |
| `PostEditorEmbeddedMediaComponent` | `@Component` (standalone) | **(A)** | Media gallery & upload |
| `PostEditorEmbeddedMediaItemComponent` | `@Component` (standalone) | **(A)** | Individual media item renderer |
| `PostsBoardComponent` | `@Component` (standalone) | **(A)** | Kanban-style posts board |
| `PostsDraftColumnComponent` | `@Component` (standalone) | **(A)** | Draft posts column |
| `PostsQueueColumnComponent` | `@Component` (standalone) | **(A)** | Scheduled posts column |
| `PostsPublishedColumnComponent` | `@Component` (standalone) | **(A)** | Published & archived column |
| `PostsListComponent` | `@Component` (standalone) | **(A)** | Posts management UI |

### Scaffold / Questionable

| Export | Kind | Rating | Notes |
|--------|------|--------|-------|
| `CmsAdminUi` | `@Component` (standalone) | **(B)** | **Empty placeholder** — selector `lib-cms-admin-ui`, no logic, no meaningful template. Likely Nx generator scaffold that leaked into the public API. |

**Summary:** 19 exports — 18 **(A)**, 1 **(B)**.

> **Decision needed:** Remove `CmsAdminUi` from `index.ts` exports, or repurpose it as a real entry component?

---

## Cross-cutting observations

| Topic | Finding |
|-------|---------|
| `@angular/fire` | Not used. All libraries use the `firebase` JS SDK directly. Intentional. |
| Standalone components | All components use the standalone pattern — no `NgModule` barrel exports. |
| SSR support | `POSTS_TRANSFER_KEY` and `ABOUT_CONFIG_TRANSFER_KEY` enable `TransferState` hydration. |
| Service abstraction | cms-core exposes `IBlogPostService` / `ISiteConfigService` interfaces + DI tokens, enabling consumers to swap implementations. |
| No internal leaks | Besides the `CmsAdminUi` scaffold, no underscore-prefixed, helper-only, or obviously-internal symbols are exported. |

## Post-audit additions (2026-03-27)

### cms-core — new exports since audit

| Export | Kind | Rating | Notes |
|--------|------|--------|-------|
| `provideFolioKit()` | `(config: FolioKitConfig) => EnvironmentProviders` | **(A)** | Single-call bootstrapper; supersedes manual `provideFirebase()` + service aliases |
| `FolioKitConfig` | Interface | **(A)** | Config shape for `provideFolioKit` |
| `SITE_ID` | `InjectionToken<string>` | **(A)** | Provided by `provideFolioKit()` when `siteId` is set. Inject to read the active site ID in any service or component. Bridges `FolioKitConfig.siteId` to DI context for multi-site deployments. |
