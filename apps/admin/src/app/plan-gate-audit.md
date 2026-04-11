<!--
  GATE_TODO inventory (grep: GATE_TODO)

  - customDomain — libs/cms-admin-ui/src/lib/settings/domain-setup/domain-setup.component.ts
  - customCss — libs/cms-admin-ui/src/lib/settings/settings-pro-tab.component.ts
  - multipleAuthors — libs/cms-admin-ui/src/lib/author-editor/authors-list.component.ts
  - analytics — libs/cms-admin-ui/src/lib/dashboard/dashboard.component.ts
  - about — libs/cms-admin-ui/src/lib/pages/pages-hub.component.ts
  - links — libs/cms-admin-ui/src/lib/pages/pages-hub.component.ts
  - videoWalkthrough — libs/cms-admin-ui/src/lib/pages/pages-hub.component.ts
  - donate — libs/cms-admin-ui/src/lib/pages/pages-hub.component.ts
  - survey — libs/cms-admin-ui/src/lib/pages/pages-hub.component.ts
  - ranking — libs/cms-admin-ui/src/lib/pages/pages-hub.component.ts
  - stream — libs/cms-admin-ui/src/lib/pages/pages-hub.component.ts
-->

# Plan gate audit (Phase 11c)

`TIER_FEATURES` top-level record keys (`starter`, `pro`, `agency`) are **plan tier labels**, not per-UI gates. Gating dimensions are `TenantFeatures.platform` keys and `TenantFeatures.unlockedPageTypes` entries defined in `libs/cms-core/src/lib/models/plan-features.model.ts`.

## Covered by `PlanGateComponent` (`cms-plan-gate`)

| Dimension | Location |
|-----------|----------|
| `taxonomy` (platform) | `libs/cms-admin-ui/src/lib/taxonomy/taxonomy-page.component.ts` — wraps Series UI in `<cms-plan-gate feature="taxonomy" …>`. |

## `about` / `links` (page types)

Both page types are included in the **starter** `unlockedPageTypes` list. `<!-- GATE_TODO: about -->` and `<!-- GATE_TODO: links -->` in `pages-hub.component.ts` mark the **Configuration** surfaces for traceability and any future tier rules; they are not implied soft-blocks for the current tier matrix.

## Deferred route guards

`requirePageType` and `requirePlatformFeature` in `libs/cms-core/src/lib/guards/` are deprecated (Phase 15). `apps/admin/src/app/app.routes.ts` and `libs/cms-admin-ui/src/lib/routes/admin.routes.ts` do not reference them.
