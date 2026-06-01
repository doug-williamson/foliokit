import '@rhombuskit/theme-engine';

// Mirror of cms-ui's ThemeRegistry augmentation. docs-ui is its own TypeScript
// program and does not import @foliokit/cms-ui, so it needs the 'light'/'dark'
// theme names registered locally for RhombusThemeService.current()/setTheme().
declare module '@rhombuskit/theme-engine' {
  interface ThemeRegistry {
    light: true;
    dark: true;
  }
}
