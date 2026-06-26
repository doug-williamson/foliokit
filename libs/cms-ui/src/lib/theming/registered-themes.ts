import type { RegisteredTheme } from '@rhombuskit/theme-engine';

/**
 * FolioKit's registered themes — the single source of truth consumed by:
 *   - provideFolioKitTheme() (runtime: populates RhombusThemeService.themes()/palettes(),
 *     so the palette switcher and setPalette()/setMode() resolve against this list);
 *   - the pre-paint init script's registered-theme allow-list (theme-init-script.ts), so a
 *     stored palette theme name is honoured before first paint (no flash, SSR-correct);
 *   - the drift-guard spec (theme-init-script.spec.ts).
 *
 * Each palette groups a light + dark theme by its `palette` field. Editorial keeps the
 * bare 'light'/'dark' names so FolioKit's existing public data-theme contract and the
 * default (system-following) behaviour are unchanged; the explicit palette:'editorial'
 * stops RhombusKit deriving two separate palettes from the un-suffixed names.
 *
 * The theme names are made type-safe by the ThemeRegistry augmentation in ./theme-registry
 * (active program-wide via foliokit-theme.providers.ts). Do NOT add a side-effect
 * `import './theme-registry'` here — it would leak into this file's emitted .d.ts and break
 * ng-packagr consumers (see the note in theme-control.component.ts).
 */
export const FOLIOKIT_REGISTERED_THEMES: readonly RegisteredTheme[] = [
  { name: 'light', label: 'Editorial', mode: 'light', palette: 'editorial' },
  { name: 'dark', label: 'Editorial', mode: 'dark', palette: 'editorial' },
  { name: 'slate-light', label: 'Slate', mode: 'light', palette: 'slate' },
  { name: 'slate-dark', label: 'Slate', mode: 'dark', palette: 'slate' },
  { name: 'sandstone-light', label: 'Sandstone', mode: 'light', palette: 'sandstone' },
  { name: 'sandstone-dark', label: 'Sandstone', mode: 'dark', palette: 'sandstone' },
];
