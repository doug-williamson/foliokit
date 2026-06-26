import '@rhombuskit/theme-engine';

// FolioKit ships its own concrete theme names. Augment RhombusKit's ThemeRegistry
// so setTheme()/setPalette()/setMode() and provideRhombusThemes() type-check against
// them. FolioKit owns the CSS that defines [data-theme="<name>"] for each:
//   - editorial palette: 'light' / 'dark' (the bare names preserve the public contract)
//   - slate palette:     'slate-light' / 'slate-dark'
//   - sandstone palette: 'sandstone-light' / 'sandstone-dark'
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
