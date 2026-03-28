/**
 * prepublishOnly hook for libs/<name>/package.json.
 * npm publish from libs/ ships Nx source and breaks consumers; publish dist/ after nx build.
 */
import path from 'node:path';

const cwd = path.resolve(process.cwd());
const norm = cwd.split(path.sep).join('/');

const underLibs = /(^|\/)libs\/[^/]+(\/|$)/.test(norm);
const underDist = /(^|\/)dist\/libs\/[^/]+(\/|$)/.test(norm);

if (underLibs && !underDist) {
  console.error(`
Do not npm publish from libs/ — that publishes Nx source, not the Angular library build.

From the repo root:
  npx nx build <project>
  npm publish dist/libs/<project> --access public

Or: npm run publish:cms-core   (see root package.json "publish:*" scripts)
`);
  process.exit(1);
}
