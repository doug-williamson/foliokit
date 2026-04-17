# FolioKit — Agent Context

## Stack
Angular 21, Nx monorepo, Firebase (modular SDK, no @angular/fire), NgRx Signal Stores, Angular Material M3, Tailwind 3. Default branch: master.

## Non-negotiable constraints
- Standalone components only, no NgModules
- ChangeDetectionStrategy.OnPush everywhere
- @if/@for/@switch control flow — never *ngIf/*ngFor
- Prettier singleQuote: true
- string | null for nullable Firestore fields (never undefined)
- Nx module boundaries: cms-admin-ui may depend on cms-core, never reverse

## Key paths
- libs/cms-core — models, services, guards, resolvers, DI tokens
- libs/cms-ui — blog page components, AppShellComponent, ThemeService
- libs/cms-admin-ui — admin signal stores, editor components, settings
- libs/cms-markdown — markdown renderer
- apps/blog — SSR blog (port 4201), app.routes.ts is [...FOLIO_BLOG_ROUTES]
- apps/admin — admin SPA (port 4203)
- functions/ — Cloud Functions Node 22

## Commit style
Conventional commits: feat(scope): description