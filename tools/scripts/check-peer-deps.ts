/**
 * Peer dependency validation script.
 *
 * For every published FolioKit library (any lib under libs/ that has a
 * peerDependencies field), cross-references each required peer against the
 * workspace root package.json dependencies + devDependencies.
 *
 * Usage:
 *   node --require @swc-node/register tools/scripts/check-peer-deps.ts
 *   npm run check:peers
 *
 * Exit codes:
 *   0 — all peer dependencies satisfied
 *   1 — one or more peer dependencies missing or incompatible
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PackageJson {
  name?: string;
  peerDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface Row {
  lib: string;
  pkg: string;
  required: string;
  found: string;
  ok: boolean;
}

// ── Semver helpers (no external dependency) ───────────────────────────────────

/** Extract the numeric major version from a semver string like "^21.2.4" → 21 */
function majorOf(version: string): number {
  const cleaned = version.replace(/^[\^~>=<]/, '').trim();
  return parseInt(cleaned.split('.')[0], 10);
}

/**
 * Lightweight range check: the workspace version satisfies the peer range if:
 *   - The peer range is "*" or "latest"
 *   - OR the major version matches and the workspace version is ≥ required min
 *
 * This avoids pulling in the `semver` package while covering the common
 * caret/tilde range patterns used across this codebase.
 */
function satisfies(workspaceVersion: string, peerRange: string): boolean {
  if (peerRange === '*' || peerRange === 'latest') return true;
  const reqMajor = majorOf(peerRange);
  const wsMajor = majorOf(workspaceVersion);
  if (reqMajor !== wsMajor) return false;

  // Strip operator and compare full version numerically
  const norm = (v: string) =>
    v.replace(/^[\^~>=<]+/, '').split('.').map((n) => parseInt(n, 10));
  const [rMaj, rMin = 0, rPat = 0] = norm(peerRange);
  const [wMaj, wMin = 0, wPat = 0] = norm(workspaceVersion);

  if (wMaj !== rMaj) return wMaj > rMaj;
  if (wMin !== rMin) return wMin > rMin;
  return wPat >= rPat;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '../..');

function readJson(filePath: string): PackageJson {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as PackageJson;
}

/**
 * Build a set of package names that are local sibling libs in this monorepo.
 * Peer deps that reference these packages are skipped — they're co-published
 * from the same repo and version-locked by convention, not by npm resolution.
 */
function localPackageNames(): Set<string> {
  const libsDir = path.join(ROOT, 'libs');
  const names = new Set<string>();
  for (const entry of fs.readdirSync(libsDir)) {
    const pkgPath = path.join(libsDir, entry, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = readJson(pkgPath);
    if (pkg.name) names.add(pkg.name);
  }
  return names;
}

function discoverLibs(): Array<{ name: string; peers: Record<string, string> }> {
  const libsDir = path.join(ROOT, 'libs');
  const libs: Array<{ name: string; peers: Record<string, string> }> = [];
  const local = localPackageNames();

  for (const entry of fs.readdirSync(libsDir)) {
    const pkgPath = path.join(libsDir, entry, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = readJson(pkgPath);
    if (!pkg.peerDependencies || Object.keys(pkg.peerDependencies).length === 0) continue;

    // Exclude peer deps that are local sibling packages — they're always satisfied
    const externalPeers = Object.fromEntries(
      Object.entries(pkg.peerDependencies).filter(([name]) => !local.has(name)),
    );
    if (Object.keys(externalPeers).length === 0) continue;
    libs.push({ name: pkg.name ?? entry, peers: externalPeers });
  }

  return libs;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const rootPkg = readJson(path.join(ROOT, 'package.json'));
const wsVersions: Record<string, string> = {
  ...(rootPkg.dependencies ?? {}),
  ...(rootPkg.devDependencies ?? {}),
};

const libs = discoverLibs();
const rows: Row[] = [];

for (const { name, peers } of libs) {
  for (const [pkg, required] of Object.entries(peers)) {
    const found = wsVersions[pkg] ?? '—';
    const ok = found !== '—' && satisfies(found, required);
    rows.push({ lib: name, pkg, required, found, ok });
  }
}

// ── Print table ───────────────────────────────────────────────────────────────

const col = (s: string, w: number) => s.padEnd(w).slice(0, w);

const libW = Math.max(12, ...rows.map((r) => r.lib.length));
const pkgW = Math.max(12, ...rows.map((r) => r.pkg.length));
const reqW = Math.max(10, ...rows.map((r) => r.required.length));
const fndW = Math.max(10, ...rows.map((r) => r.found.length));

const divider = `${'─'.repeat(libW + 2)}┼${'─'.repeat(pkgW + 2)}┼${'─'.repeat(reqW + 2)}┼${'─'.repeat(fndW + 2)}┼${'─'.repeat(8)}`;
const header = ` ${col('Library', libW)} │ ${col('Peer package', pkgW)} │ ${col('Required', reqW)} │ ${col('Workspace', fndW)} │ Status `;

console.log('');
console.log('FolioKit peer dependency check');
console.log('');
console.log(header);
console.log(divider);

for (const { lib, pkg, required, found, ok } of rows) {
  const status = ok ? '  ✔ PASS' : '  ✖ FAIL';
  console.log(` ${col(lib, libW)} │ ${col(pkg, pkgW)} │ ${col(required, reqW)} │ ${col(found, fndW)} │${status}`);
}

console.log('');

const failures = rows.filter((r) => !r.ok);

if (failures.length === 0) {
  console.log(`All ${rows.length} peer dependencies satisfied.\n`);
  process.exit(0);
} else {
  console.error(`${failures.length} peer dependenc${failures.length === 1 ? 'y' : 'ies'} unsatisfied:\n`);
  for (const { lib, pkg, required, found } of failures) {
    console.error(`  ${lib}: ${pkg} requires ${required} — workspace has ${found}`);
  }
  console.error('');
  process.exit(1);
}
