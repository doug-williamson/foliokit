import '@rhombuskit/theme-engine';

// Mirror of cms-ui's ThemeRegistry augmentation. docs-ui is its own TypeScript
// program, so it keeps this augmentation locally to guarantee the 'light'/'dark'
// theme names type-check here (RhombusThemeService.current()/setTheme()) —
// ng-packagr can drop augmentations that aren't in a program's own entry graph,
// so we don't rely on cms-ui's copy surviving across the package boundary.
declare module '@rhombuskit/theme-engine' {
  interface ThemeRegistry {
    light: true;
    dark: true;
  }
}
