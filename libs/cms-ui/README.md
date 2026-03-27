# @foliokit/cms-ui
Part of the [Folio](https://github.com/doug-williamson/foliokit) ecosystem.
> This package is in early development. API is unstable.

## Design Tokens

`@foliokit/cms-ui` ships a set of CSS custom properties that define the FolioKit
design system: color palette, semantic theme tokens (light/dark), typography,
border radii, shadows, and component tokens.

### Plain CSS

Add the token stylesheet to your `angular.json` (or `project.json`) styles
array:

```jsonc
// angular.json
"styles": [
  "node_modules/@foliokit/cms-ui/src/styles/tokens.css",
  "src/styles.scss"
]
```

Then use the custom properties anywhere in your CSS:

```css
.card {
  background: var(--surface-0);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-md);
}
```

### SCSS

If you prefer SCSS, import the forwarding partial:

```scss
@use '@foliokit/cms-ui/src/styles/tokens';
```

This loads the same CSS custom properties. The design system is built entirely
on CSS custom properties (not SCSS variables) to support runtime theme
switching.

### Theming

Tokens resolve against the `[data-theme]` attribute. Set it on `<html>` to
switch between light and dark mode:

```html
<html data-theme="light">  <!-- or "dark" -->
```

Use `ThemeService` from this package to toggle programmatically:

```ts
import { ThemeService } from '@foliokit/cms-ui';

constructor(private theme: ThemeService) {
  this.theme.setScheme('dark');
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
