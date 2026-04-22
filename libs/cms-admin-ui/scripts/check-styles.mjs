/**
 * Regression guard for shared admin layout styles.
 *
 * Run via: nx check-styles cms-admin-ui
 *
 * Reads _layout.scss and asserts that the canonical admin CSS class
 * selectors are present. Catches accidental deletion or renaming of
 * classes that every cms-admin-ui page component template depends on,
 * without causing a TypeScript error at component compile time.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const layoutPath = resolve(__dirname, '../src/styles/_layout.scss');
const source = readFileSync(layoutPath, 'utf8');

const required = [
  '.page-header',
  '.page-header-title',
  '.page-header-actions',
  '.page-heading',
  '.page-content',
  '.page-content-form',
  '.folio-admin',
  '.folio-admin .page-header',
  '.folio-admin .page-content',
  '.empty-state',
  '.tab-strip',
];

let failed = false;

if (source.length === 0) {
  console.error('FAIL: _layout.scss is empty');
  failed = true;
}

for (const selector of required) {
  if (!source.includes(selector)) {
    console.error(`FAIL: _layout.scss is missing selector "${selector}"`);
    failed = true;
  }
}

if (failed) {
  console.error(
    '\ncms-admin-ui shared layout styles regression check failed.\n' +
      'Consumers of @foliokit/cms-admin-ui rely on these selectors being present\n' +
      'in libs/cms-admin-ui/src/styles/_layout.scss.\n',
  );
  process.exit(1);
}

console.log(`OK: all ${required.length} required selectors present in _layout.scss`);
