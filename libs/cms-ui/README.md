# @foliokit/cms-ui

Angular shell layout components, design tokens, and theme service for the FolioKit CMS.
Provides `AppShellComponent`, `ThemeService`, page components, and the full CSS/SCSS
design token system.

Part of the [FolioKit](https://github.com/doug-williamson/foliokit) ecosystem.

## Install

```bash
npm install @foliokit/cms-ui
```

## Peer Dependencies

| Package | Version |
|---------|---------|
| `@angular/cdk` | `^21.2.2` |
| `@angular/common` | `^21.2.4` |
| `@angular/core` | `^21.2.4` |
| `@angular/material` | `^21.2.2` |
| `@angular/platform-browser` | `^21.2.4` |
| `@angular/router` | `^21.2.4` |
| `@foliokit/cms-core` | `^1.0.0` |
| `@foliokit/cms-markdown` | `^1.0.0` |
| `ngx-markdown` | `^21.1.0` |
| `rxjs` | `~7.8.0` |

---

## ⚠️ Required: Vite pre-bundling exclusion

If your app uses the Angular CLI `application` builder (Vite-based), you **must** exclude FolioKit packages from Vite's dep-optimizer. Without this, the bundler inlines a second copy of Angular inside the FolioKit chunk, causing `NG0203` injection errors on every standalone route.

```jsonc
// angular.json → projects.<name>.architect.build.options
// (repeat for the "serve" target if it has its own options block)
{
  "prebundle": {
    "exclude": [
      "@foliokit/cms-ui",
      "@foliokit/cms-core",
      "@foliokit/cms-markdown"
    ]
  }
}
```

---

## ⚠️ Required: Angular Material theme setup

`AppShellComponent` and all page components use Angular Material. Due to how
Angular Material M3 theming works, the `@include mat.theme(...)` mixin **must
be called in your application's global stylesheet** — it cannot be bundled
inside a library.

If you skip this step, Material components will render without colour, elevation,
or typography. This is the most common issue new consumers encounter.

Add the following to your global `styles.scss`:

```scss
@use '@angular/material' as mat;

// Light theme (also serves as the default)
html,
html[data-theme='light'] {
  @include mat.theme((
    color: (
      theme-type: light,
      primary: mat.$cyan-palette,
      tertiary: mat.$cyan-palette,
    ),
    typography: 'Plus Jakarta Sans',
    density: 0,
  ));
}

// Dark theme
html[data-theme='dark'] {
  @include mat.theme((
    color: (
      theme-type: dark,
      primary: mat.$cyan-palette,
      tertiary: mat.$cyan-palette,
    ),
    typography: 'Plus Jakarta Sans',
    density: 0,
  ));
}
```

`ThemeService` (exported from this package) manages the `[data-theme]` attribute
on `<html>` and persists the user's preference to `localStorage`.

---

## Getting started

### 1. Provide the shell configuration

In your `app.config.ts`, register `SHELL_CONFIG` alongside `provideFolioKit()`:

```ts
import { signal } from '@angular/core';
import { provideFolioKit } from '@foliokit/cms-core';
import { SHELL_CONFIG, ShellConfig, ShellConfigSignal } from '@foliokit/cms-ui';

// SHELL_CONFIG requires a Signal<ShellConfig>, not a plain object.
const shellConfig: ShellConfigSignal = signal<ShellConfig>({
  appName: 'My Site',
  nav: [
    { label: 'Blog', path: '/blog' },
    { label: 'About', path: '/about' },
  ],
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideMarkdown(),
    provideFolioKit({ firebaseConfig: environment.firebase }),
    { provide: SHELL_CONFIG, useValue: shellConfig },
  ],
};
```

### 2. Wrap your app in the shell

```ts
import { AppShellComponent } from '@foliokit/cms-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AppShellComponent, RouterOutlet],
  template: `
    <folio-app-shell>
      <router-outlet />
    </folio-app-shell>
  `,
})
export class AppComponent {}
```

### 3. Import design tokens and Tailwind utilities

In `angular.json` (or `project.json`) styles array:

```jsonc
"styles": [
  "node_modules/@foliokit/cms-ui/styles/utilities.css",
  "src/styles.scss"
]
```

`utilities.css` is a pre-built snapshot of every Tailwind utility class used by FolioKit component templates. It must be loaded before your own styles so your overrides take precedence.

In your root `styles.scss`, import the FolioKit SCSS design system:

```scss
@use '@foliokit/cms-ui/styles/index' as folio;

@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Design Tokens

`@foliokit/cms-ui` ships a set of CSS custom properties that define the FolioKit
design system: color palette, semantic theme tokens (light/dark), typography,
border radii, shadows, and component tokens.

Tokens resolve against the `[data-theme]` attribute on a parent element (typically
`<html>`). Use `ThemeService` to switch programmatically:

```ts
import { ThemeService } from '@foliokit/cms-ui';

// In a component or service:
readonly theme = inject(ThemeService);

toggleDark() {
  this.theme.toggle();
}
```

### Token Categories

| Prefix | Purpose |
|--------|---------|
| `--slate-*`, `--cloud-*`, `--teal-*`, `--violet-*` | Base color palette |
| `--bg`, `--bg-subtle` | Page backgrounds |
| `--surface-0` .. `--surface-3` | Elevated surface layers |
| `--border`, `--border-strong`, `--border-accent` | Borders |
| `--text-primary`, `--text-secondary`, `--text-muted`, `--text-accent` | Typography colors |
| `--btn-primary-bg`, `--btn-primary-text`, `--btn-primary-hover` | Button tokens |
| `--logo-bg`, `--logo-text`, `--logo-dot` | Logo tokens |
| `--shadow-sm` .. `--shadow-xl` | Elevation shadows |
| `--focus-ring`, `--focus-border` | Focus indicators |
| `--nav-active-bg`, `--nav-active-color` | Navigation highlights |
| `--font-display`, `--font-body`, `--font-mono` | Font stacks |
| `--r-xs` .. `--r-2xl` | Border radii |

---

## Theming — brand colour override

Replace the default teal palette using the `folio-theme()` Sass mixin:

```scss
// src/styles.scss
@use '@foliokit/cms-ui/styles/index' as folio;
@use '@foliokit/cms-ui/styles/theme-factory' as folio-factory;

// Emit [data-theme="light"] and [data-theme="dark"] token blocks for your brand:
@include folio-factory.folio-theme(
  $primary:    #6366f1,  // your accent colour (replaces teal)
  $on-primary: #ffffff,  // text on primary-coloured buttons
  $surface:    #ffffff   // light-theme card surface
);
```

The mixin overrides `--btn-primary-*`, `--text-accent`, `--border-accent`, `--nav-active-*`, `--surface-0`, and `--focus-*` in both themes. All other tokens keep their default values.

> **Important:** When overriding `--btn-primary-bg` in dark mode, always also set `--btn-primary-text`. The default dark value is `#ffffff` (white), designed for contrast against teal. A dark button background paired with white text may fail WCAG AA — set `--btn-primary-text` explicitly to a contrasting colour.

### Hero card overlay tokens

The hero post card exposes these tokens for photographic treatment customisation:

| Token | Default |
|---|---|
| `--hero-overlay-start` | `rgba(0,0,0,0.75)` |
| `--hero-overlay-mid` | `rgba(0,0,0,0.2)` |
| `--hero-chip-bg` | `rgba(255,255,255,0.18)` |
| `--hero-chip-bg-hover` | `rgba(255,255,255,0.30)` |
| `--hero-title-color` | `#ffffff` |
| `--hero-meta-color` | `rgba(255,255,255,0.75)` |

---

## Route customisation

`createBlogRoutes()` accepts component overrides so you can substitute any page while keeping the library's resolvers and guards:

```ts
import { createBlogRoutes, BLOG_ROUTE_PATHS } from '@foliokit/cms-ui';
import { MyAboutPage } from './about/my-about-page.component';

export const appRoutes: Route[] = createBlogRoutes({
  postResolver,
  aboutComponent: MyAboutPage,  // receives { about: AboutPageConfig | null } in route data
  linksComponent: MyLinksPage,
  homeComponent:  MyHomePage,
});
```

Use `BLOG_ROUTE_PATHS` when you need to match or augment routes by path string — avoids magic strings:

```ts
import { BLOG_ROUTE_PATHS } from '@foliokit/cms-ui';
// BLOG_ROUTE_PATHS.about      === 'about'
// BLOG_ROUTE_PATHS.postDetail === 'posts/:slug'
// BLOG_ROUTE_PATHS.links      === 'links'
```

---

## Full Documentation

[foliokitcms.com/docs/components/shell](https://foliokitcms.com/docs/components/shell)
