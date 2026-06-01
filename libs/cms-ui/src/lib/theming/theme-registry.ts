import '@rhombuskit/theme-engine';

// FolioKit ships its own concrete theme names. Augment RhombusKit's ThemeRegistry
// so setTheme('light')/setTheme('dark') and provideRhombusTheme({ light, dark })
// type-check. FolioKit owns the CSS that defines [data-theme="light"|"dark"].
declare module '@rhombuskit/theme-engine' {
  interface ThemeRegistry {
    light: true;
    dark: true;
  }
}
