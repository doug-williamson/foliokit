/**
 * Dry-run npm pack for each built library under dist/libs/*.
 * Run after: npm run build:libs (or nx build …).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const projects = ['cms-core', 'cms-ui', 'cms-markdown', 'cms-admin-ui', 'docs-ui'];

let failed = false;

for (const name of projects) {
  const dir = path.join(root, 'dist', 'libs', name);
  const pkg = path.join(dir, 'package.json');
  if (!fs.existsSync(pkg)) {
    console.error(`Missing ${path.relative(root, pkg)} — run nx build ${name} or npm run build:libs first.`);
    failed = true;
    continue;
  }
  console.log(`\n--- npm pack --dry-run: ${name} ---\n`);
  const r = spawnSync('npm', ['pack', '--dry-run'], {
    cwd: dir,
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) {
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
