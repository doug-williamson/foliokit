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
import { provideFolioKit } from '@foliokit/cms-core';
import { SHELL_CONFIG } from '@foliokit/cms-ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withFetch()),
    provideMarkdown(),
    provideFolioKit({ firebaseConfig: environment.firebase }),
    {
      provide: SHELL_CONFIG,
      useValue: {
        appName: 'My Site',
        nav: [
          { label: 'Blog', path: '/blog' },
          { label: 'About', path: '/about' },
        ],
      },
    },
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

### 3. Import design tokens

In `angular.json` (or `project.json`) styles array:

```jsonc
"styles": [
  "node_modules/@foliokit/cms-ui/styles/tokens.css",
  "src/styles.scss"
]
```

Or via SCSS:

```scss
@use '@foliokit/cms-ui/styles/tokens';
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

## Full Documentation

[foliokitcms.com/docs/components/shell](https://foliokitcms.com/docs/components/shell)
