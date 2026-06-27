export * from './lib/app-shell/app-shell.component';
export * from './lib/app-shell/shell-nav-footer.directive';
export * from './lib/icons/provide-cms-ui-mat-icons';
export * from './lib/shell-config.token';
export * from './lib/skeleton/folio-skeleton.component';
export * from './lib/about-page/about-page.component';
export * from './lib/about-page/blog-about-page.component';
export * from './lib/links-page/links-page.component';
export * from './lib/route-data';

// ── Blog components ───────────────────────────────────────────────────────────
export * from './lib/home/blog-home.component';
export * from './lib/post-list/blog-post-card.component';
export * from './lib/post-list/blog-tag-filter.component';
export * from './lib/post-list/blog-post-list.component';
export * from './lib/post-detail/blog-post-detail.component';
export * from './lib/post-detail/series-nav.component';
export * from './lib/not-found/not-found.component';

// ── Blog routes ───────────────────────────────────────────────────────────────
export * from './lib/routes/blog.routes';

// ── Taxonomy ──────────────────────────────────────────────────────────────────
export * from './lib/series/series.resolver';
export * from './lib/series/series-list.component';
export * from './lib/series/series-detail.component';

// ── Theming ───────────────────────────────────────────────────────────────────
export * from './lib/theming';

// Re-export the theme engine's runtime surface so consumers have a single
// FolioKit import (paired with provideFolioKitTheme above). @rhombuskit/theme-engine
// is a peerDependency, so this re-exports the same singleton consumers install.
export { RhombusThemeService } from '@rhombuskit/theme-engine';
export type { ThemeName, ThemePreference } from '@rhombuskit/theme-engine';
