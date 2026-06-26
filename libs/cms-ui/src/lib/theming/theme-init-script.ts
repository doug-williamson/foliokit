/**
 * Pre-paint theme init script for FolioKit apps.
 *
 * Inline this in the <head> of every FolioKit app's index.html, BEFORE any
 * stylesheet, so `data-theme` is set on <html> before first paint — preventing
 * the flash-of-wrong-theme that RhombusThemeService alone can't avoid (it runs
 * after hydration).
 *
 * Composed of two synchronous IIFEs:
 *   1. Legacy migration — if the RhombusKit preference key is absent but a
 *      legacy FolioKit `folio-theme` value (always 'light' | 'dark') exists,
 *      copy it across. This is the one-time PR1 migration, moved ahead of paint
 *      so migrating users never flash. Because it persists the key here, the
 *      runtime no longer needs a bootstrap migration initializer.
 *   2. Rhombus resolution — the VERBATIM body of getThemeInitScript(config,
 *      FOLIOKIT_REGISTERED_THEMES) from @rhombuskit/theme-engine. Reads the
 *      (now-migrated) preference, accepts a registered palette theme name (the
 *      `R=[…]` allow-list), resolves 'system' via prefers-color-scheme, and sets
 *      `data-theme` — so a stored palette (e.g. 'slate-dark') paints with no flash.
 *
 * IMPORTANT: the three app index.html files
 *   - apps/blog/src/index.html
 *   - apps/admin/src/index.html
 *   - apps/docs/src/index.html
 * inline this exact string. Keep them in sync with this constant. The unit test
 * (theme-init-script.spec.ts) pins the rhombus half against the live
 * getThemeInitScript output, so it fails if RhombusKit's resolution drifts.
 */

/** One-time legacy migration: folio-theme -> rhombuskit:theme-preference. */
const LEGACY_MIGRATION =
  `(function(){try{var K='rhombuskit:theme-preference';` +
  `if(localStorage.getItem(K)===null){var g=localStorage.getItem('folio-theme');` +
  `if(g==='light'||g==='dark'){localStorage.setItem(K,g);}}}catch(e){}})();`;

/**
 * Verbatim body of getThemeInitScript({ light:'light', dark:'dark', default:'system' },
 * FOLIOKIT_REGISTERED_THEMES). Sourced from @rhombuskit/theme-engine; the drift-guard test
 * asserts this still matches the package's output. The `R=[…]` allow-list mirrors the
 * registered palette theme names so a stored palette is honoured pre-paint. Do not edit by
 * hand — regenerate from the installed package (see theme-init-script.spec.ts) and keep the
 * R array in sync with registered-themes.ts.
 */
const RHOMBUS_RESOLUTION =
  `(function(){try{var L='light',D='dark',d='system',R=["light","dark","slate-light","slate-dark","sandstone-light","sandstone-dark"];` +
  `var s=localStorage.getItem('rhombuskit:theme-preference');` +
  `var p=(s===L||s===D||s==='system'||R.indexOf(s)>=0)?s:d;` +
  `var r=p==='system'?(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?D:L):p;` +
  `document.documentElement.setAttribute('data-theme',r);}catch(e){}})();`;

/**
 * The full `<script>…</script>` string to inline in <head>. Exported so app
 * index.html files (and downstream FolioKit consumers) have a single source of
 * truth for the pre-paint script.
 */
export const FOLIOKIT_THEME_INIT_SCRIPT = `<script>${LEGACY_MIGRATION}${RHOMBUS_RESOLUTION}</script>`;
