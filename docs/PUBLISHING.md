# Publishing `@foliokit/*` packages

## Wrong vs right

| Wrong | Right |
|--------|--------|
| `npm publish` from `libs/cms-core` (or any `libs/<name>`) | `nx build <project>` then `npm publish dist/libs/<project>` from repo root |
| Tarball contains Nx `src/index.ts` and breaks consumers (esbuild cannot resolve `./lib/...`) | Tarball contains ng-packagr output: `package.json` with `exports` / `module` / `typings`, ESM bundles under `esm2022/` (or similar), `.d.ts` |

Never publish the workspace `package.json` files under `libs/*` as the npm artifact. Those files exist for Nx and version metadata; **ng-packagr** writes the installable package into **`dist/libs/<name>`**.

## Guardrails

Each `libs/*/package.json` includes a **`prepublishOnly`** script that **fails** if you run `npm publish` from `libs/`. Publishing from **`dist/libs/<name>`** after a build does not run that hook (the generated `package.json` has no `scripts` field).

## Commands (repo root)

Build all publishable libraries:

```bash
npm run build:libs
```

Dry-run what would be published (same set as `build:libs`):

```bash
npm run verify:packs
```

Build and dry-run in one step:

```bash
npm run verify:publish-artifacts
```

Publish a single package:

```bash
npm run publish:cms-core
# … or publish:cms-ui, publish:cms-markdown, publish:cms-admin-ui, publish:docs-ui
```

Publish all (build once, then publish each; order matters for peers):

```bash
npm run publish:libs
```

### Recommended publish order

1. `@foliokit/cms-core`
2. `@foliokit/cms-ui`
3. `@foliokit/cms-markdown`
4. `@foliokit/cms-admin-ui` (pre-release; consider `npm publish … --tag next` — see [LAUNCH-CHECKLIST.md](./LAUNCH-CHECKLIST.md))
5. `@foliokit/docs-ui` (if you ship it)

## Version bumps

Bump **`version`** in `libs/<name>/package.json` before building and publishing. ng-packagr copies that into `dist/libs/<name>/package.json`.

## Consumer sanity check

After `npm install @foliokit/cms-core` in an app, open `node_modules/@foliokit/cms-core/package.json`:

- It should define **`exports`** (or **`module`** / **`typings`**) pointing at built files.
- You should **not** rely on `node_modules/@foliokit/cms-core/src/index.ts` as the main entry for bundling.

If you only see monorepo-style `src/` without proper entry fields, the wrong directory was published.

## Local consumption without npm

After `npm run build:libs`, you can depend on built folders or tarballs:

**`file:` paths** (adjust relative path to your clone):

```json
"@foliokit/cms-core": "file:../foliokit/dist/libs/cms-core"
```

**Packed tarballs** (avoids some `file:` / duplicate Angular quirks):

```bash
cd dist/libs/cms-core && npm pack
```

Then in the consumer `package.json`: `"@foliokit/cms-core": "file:./vendor/foliokit-cms-core-1.0.1.tgz"`.

## CI

The workflow **Verify publish artifacts** (`.github/workflows/verify-publish-artifacts.yml`) runs on pushes and pull requests to **`master`**: `npm ci`, `npm run build:libs`, `npm run verify:packs`.
