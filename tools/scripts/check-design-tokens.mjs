/**
 * Guards the FolioKit→RhombusKit token discipline in COMPONENT code:
 *
 *   1. No Angular Material M3 system vars (`--mat-sys-*`). Those belong only to
 *      the foundation Material bridge (libs/cms-ui/src/styles/_theme.scss); every
 *      component must consume the RhombusKit contract instead (--text-*, --surface-*,
 *      --border, --status-*, --focus-border, …).
 *   2. No raw palette scales (`var(--teal-500)`, `var(--blue-400)`, `var(--red-600)`,
 *      `var(--green-…)`, `var(--violet-…)`, `var(--slate-…)`, `var(--cloud-…)`).
 *      Palettes are defined once in _tokens.scss and surfaced through semantic
 *      tokens; components reference the semantic token, never the raw scale, so a
 *      theme pack (Slate/Sandstone) re-themes everything.
 *
 * The foundation token/style layer is intentionally exempt (that is where the
 * bridge and the palette live). Run: node tools/scripts/check-design-tokens.mjs
 * (or: npm run check:design-tokens)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

/** Component trees to scan. */
const SCAN_DIRS = [
  'libs/cms-admin-ui/src',
  'libs/docs-ui/src',
  'libs/cms-ui/src/lib',
  'apps/admin/src/app',
  'apps/blog/src/app',
  'apps/docs/src/app',
];

/** Path fragments that are exempt (foundation token/style/bridge layer + tests). */
const EXCLUDE = ['/styles/', 'node_modules', '/dist/', '.spec.'];

const EXTS = new Set(['.ts', '.html', '.scss', '.css']);

const RULES = [
  {
    name: 'Angular Material M3 system var (--mat-sys-*)',
    re: /--mat-sys-[\w-]+/g,
    fix: 'use the RhombusKit contract token (--text-*, --surface-*, --border, --status-*, --focus-border) instead',
  },
  {
    name: 'raw palette scale (var(--<scale>-NNN))',
    re: /var\(\s*--(?:teal|blue|red|green|violet|slate|cloud)-\d+/g,
    fix: 'use a semantic token (--text-accent, --error, --border-accent, --status-*, --surface-*) instead',
  },
];

/** @param {string} dir @param {string[]} out */
function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (EXCLUDE.some((frag) => full.includes(frag))) continue;
    if (e.isDirectory()) walk(full, out);
    else if (EXTS.has(path.extname(e.name))) out.push(full);
  }
}

const files = [];
for (const d of SCAN_DIRS) walk(path.join(root, d), files);

const violations = [];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      const m = rule.re.exec(line);
      if (m) {
        violations.push({
          file: path.relative(root, file),
          line: i + 1,
          rule: rule.name,
          snippet: m[0],
          fix: rule.fix,
        });
      }
    }
  });
}

if (violations.length === 0) {
  console.log(`✓ check:design-tokens — ${files.length} component files clean (no --mat-sys-* or raw palette scales).`);
  process.exit(0);
}

console.error(`✘ check:design-tokens — ${violations.length} violation(s):\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  ${v.snippet}`);
  console.error(`      ${v.rule} → ${v.fix}\n`);
}
console.error('Component code must use the RhombusKit token contract, not Material M3 system vars or raw palette scales.');
process.exit(1);
