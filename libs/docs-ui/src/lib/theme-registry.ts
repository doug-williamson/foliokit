import '@rhombuskit/theme-engine';

// Mirror of cms-ui's ThemeRegistry augmentation. docs-ui is its own TypeScript
// program, so it keeps this augmentation locally to guarantee FolioKit's theme
// names type-check here (RhombusThemeService.current()/setTheme()/mode()) —
// ng-packagr can drop augmentations that aren't in a program's own entry graph,
// so we don't rely on cms-ui's copy surviving across the package boundary.
declare module '@rhombuskit/theme-engine' {
  interface ThemeRegistry {
    light: true;
    dark: true;
    'slate-light': true;
    'slate-dark': true;
    'sandstone-light': true;
    'sandstone-dark': true;
  }
}
