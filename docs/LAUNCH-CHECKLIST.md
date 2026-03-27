# FolioKit Launch Checklist

Pre-publish verification for the first external release of `@foliokit/*` packages.

---

## 1. npm pack dry-run verification

Run `npm pack --dry-run` in each library's dist directory to verify the published
tarball contains the expected files and no secrets:

```bash
# Build all libraries first
npx nx run-many --target=build --projects=cms-core,cms-ui,cms-markdown,cms-admin-ui

# Dry-run pack for each
cd dist/libs/cms-core    && npm pack --dry-run && cd -
cd dist/libs/cms-ui      && npm pack --dry-run && cd -
cd dist/libs/cms-markdown && npm pack --dry-run && cd -
cd dist/libs/cms-admin-ui && npm pack --dry-run && cd -
```

**Verify for each package:**
- [ ] `package.json` is present with correct `name`, `version`, `peerDependencies`
- [ ] No `.ts` source files included (only `.js`, `.d.ts`, `.mjs`)
- [ ] No `node_modules/` included
- [ ] No `.env` or service account files included
- [ ] `README.md` is present
- [ ] `CHANGELOG.md` is present (after first release-please PR merge)
- [ ] **cms-ui only:** `styles/tokens.css` and `styles/tokens.scss` are included

---

## 2. README.md completeness check

Each published package must have:

| Requirement | cms-core | cms-ui | cms-markdown | cms-admin-ui |
|-------------|----------|--------|-------------|-------------|
| One-paragraph description | [ ] | [ ] | [ ] | [ ] |
| `npm install` command | [ ] | [ ] | [ ] | [ ] |
| Peer dependencies table | [ ] | [ ] | [ ] | [ ] |
| Minimal usage example | [ ] | [ ] | [ ] | [ ] |
| Link to full docs | [ ] | [ ] | [ ] | [ ] |
| Pre-release banner (admin-ui only) | n/a | n/a | n/a | [ ] |

---

## 3. Firebase project swap (demo)

The demo site (`demo/`) uses placeholder Firebase credentials. Before the demo
goes live at `stark.foliokit.dev`:

- [ ] Create a `foliokit-prod` Firebase project (or `stark-foliokit` per decisions doc)
- [ ] Enable Firestore, Storage, and Authentication
- [ ] Copy real credentials to `demo/src/environments/environment.prod.ts`
- [ ] Seed Firestore with the Tony Stark site config and sample posts
- [ ] Deploy security rules from `docs/` Firestore rules reference
- [ ] Verify `ng build --configuration=production` passes with real credentials
- [ ] Deploy to Firebase Hosting (`firebase deploy --only hosting`)

---

## 4. GitHub repository visibility

- [ ] Ensure `doug-williamson/foliokit` is **public** (or ready to flip)
- [ ] Create `doug-williamson/foliokit-demo-stark` repo for the extracted demo
- [ ] Push `demo/` contents to the demo repo (strip `file:` paths, use registry versions)
- [ ] Add a link to the demo repo in the main README
- [ ] Verify GitHub Actions workflows run on the public repo
- [ ] Set up branch protection on `master` (require PR, CI checks)

---

## 5. npm publish order

Libraries have inter-dependencies. Publish in this order to avoid install failures:

```
1. @foliokit/cms-core       (no FolioKit deps)
2. @foliokit/cms-ui          (depends on cms-core)
3. @foliokit/cms-markdown    (depends on cms-core)
4. @foliokit/cms-admin-ui    (depends on cms-core; 0.x pre-release)
```

**Publish commands:**

```bash
# Build all
npx nx run-many --target=build --projects=cms-core,cms-ui,cms-markdown,cms-admin-ui

# Publish in order
npm publish dist/libs/cms-core --access public
npm publish dist/libs/cms-ui --access public
npm publish dist/libs/cms-markdown --access public
npm publish dist/libs/cms-admin-ui --access public --tag next  # pre-release tag
```

**Note:** `cms-admin-ui` should be published with `--tag next` so that `npm install @foliokit/cms-admin-ui`
does not resolve to the 0.x pre-release by default.

---

## 6. Post-publish smoke test

After publishing to npm, verify the packages install correctly from the registry:

```bash
# In the smoke-test/ project:
cd smoke-test

# Replace file: paths with registry versions
# In package.json, change:
#   "@foliokit/cms-core": "file:../dist/libs/cms-core"
# to:
#   "@foliokit/cms-core": "^1.0.0"
# (repeat for cms-ui, cms-markdown)

# Clean install from registry
rm -rf node_modules package-lock.json
npm install

# Build
./node_modules/.bin/ng build --configuration=production
```

**Verify:**
- [ ] `npm install` resolves all peer dependencies without errors
- [ ] `ng build --configuration=production` produces zero errors
- [ ] No `file:` path quirks (the InputSignal brand mismatch from FINDING-01 should be gone)
- [ ] `tokens.css` loads correctly from `node_modules/@foliokit/cms-ui/styles/tokens.css`
- [ ] SCSS partial resolution: add `@use '@foliokit/cms-ui/styles/tokens';` to the smoke-test `src/styles.scss` and verify it resolves to `_tokens.scss` in the installed package without errors. This confirms the underscore-prefixed partial ships correctly and SCSS resolution works from the registry (not just `file:` paths).

---

## 7. Launch announcement blog post

Create a draft blog post at `apps/blog/` (or as a seed post in Firestore):

**Metadata:**
```typescript
{
  slug: 'introducing-foliokit',
  title: 'Introducing FolioKit: An Angular CMS for Personal Sites',
  status: 'draft',
  tags: ['announcement', 'open-source'],
  seo: {
    title: 'Introducing FolioKit',
    description: 'FolioKit is an open-source Angular CMS built on Firebase. Ship a personal blog, portfolio, or link-in-bio site in minutes.',
  },
}
```

**Content outline (stub):**
- What FolioKit is (one-paragraph elevator pitch)
- Why it exists (personal sites shouldn't need a CMS team)
- Architecture overview (Angular 21 + Firebase + Material 3)
- Getting started in 5 minutes (link to docs)
- The Iron Man demo (link to `stark.foliokit.dev`)
- What's next (admin UI, themes, plugins)

---

## Final sign-off

- [ ] All checkboxes above are complete
- [ ] `release-please` PR merged on `master` (generates CHANGELOGs)
- [ ] npm packages published in correct order
- [ ] Post-publish smoke test passes
- [ ] Demo site live at `stark.foliokit.dev`
- [ ] Docs site live at `foliokitcms.com`
- [ ] Launch blog post published
- [ ] Social media announcement posted
