/**
 * Verifies the pre-paint theme <script> inlined in each app's index.html matches
 * the canonical FOLIOKIT_THEME_INIT_SCRIPT in @foliokit/cms-ui — the scripts are
 * hand-inlined (no build-time injection), so this guards against drift.
 *
 * Closes the chain: theme-init-script.spec.ts guards getThemeInitScript (rhombus)
 * ← the const; this guards the const ← the three index.html files.
 *
 * Run: node tools/scripts/verify-theme-init.mjs  (or: npm run verify:theme-init)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const SOURCE = 'libs/cms-ui/src/lib/theming/theme-init-script.ts';
const INDEX_HTML_PATHS = [
  'apps/blog/src/index.html',
  'apps/admin/src/index.html',
  'apps/docs/src/index.html',
];

/**
 * Extract the canonical script from the source. theme-init-script.ts is pure
 * (no imports, no type annotations — only string consts), so we can evaluate it
 * directly after stripping the `export` keyword.
 */
function loadCanonicalScript() {
  const src = fs.readFileSync(path.join(root, SOURCE), 'utf8');
  const body = src.replace(/^export /gm, '');
  // eslint-disable-next-line no-new-func
  return new Function(`${body}\nreturn FOLIOKIT_THEME_INIT_SCRIPT;`)();
}

const canonical = loadCanonicalScript();
let failed = false;

for (const rel of INDEX_HTML_PATHS) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (html.includes(canonical)) {
    console.log(`✓ ${rel} — pre-paint theme script in sync`);
  } else {
    console.error(
      `✗ ${rel} — inlined theme script does NOT match FOLIOKIT_THEME_INIT_SCRIPT.\n` +
        `  Re-copy the exact string from ${SOURCE} into the <head>.`,
    );
    failed = true;
  }
}

if (failed) {
  console.error('\nTheme init-script drift detected. See messages above.');
  process.exit(1);
}
console.log('\nAll app index.html pre-paint scripts match the canonical FOLIOKIT_THEME_INIT_SCRIPT.');
