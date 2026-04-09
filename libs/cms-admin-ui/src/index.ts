export * from './lib/cms-admin-ui/cms-admin-ui';

// ── Stores ────────────────────────────────────────────────────────────────────
export * from './lib/author-editor/author-editor.store';
export * from './lib/site-config-editor/site-config-editor.store';
export * from './lib/post-editor/post-editor.store';
export * from './lib/posts-list/posts-list.store';
export * from './lib/taxonomy/taxonomy.store';

// ── Guards ────────────────────────────────────────────────────────────────────
export * from './lib/guards/auth.guard';
export * from './lib/guards/setup.guard';
export * from './lib/guards/unsaved-changes.guard';

// ── Shell & login ─────────────────────────────────────────────────────────────
export * from './lib/login/admin-login.component';
export * from './lib/shell/admin-shell.component';
export * from './lib/setup/setup.component';

// ── Routes ────────────────────────────────────────────────────────────────────
export * from './lib/routes/admin.routes';

// ── Provider ──────────────────────────────────────────────────────────────────
export * from './lib/provide-admin-kit';
export * from './lib/provide-admin-markdown';
export * from './lib/icons/provide-admin-mat-icons';

// ── Dashboard ─────────────────────────────────────────────────────────────────
export * from './lib/dashboard/dashboard.component';

// ── Editor page components (Phase 2 — stubs in Phase 1) ──────────────────────
export * from './lib/post-editor/post-editor-page.component';
export * from './lib/author-editor/authors-list.component';
export * from './lib/author-editor/author-form.component';
export * from './lib/pages/admin-pages.component';
export * from './lib/pages/admin-pages-section.component';
export * from './lib/site-config-editor/site-config-page.component';
export * from './lib/page-editor/links-page-editor.component';
export * from './lib/page-editor/about-page-editor.component';
export * from './lib/settings/settings-page.component';
export * from './lib/settings/domain-setup/domain-setup.component';

// ── Plan gating ───────────────────────────────────────────────────────────────
export * from './lib/plan-gate/plan-gate.component';
export * from './lib/plan-gate/plan-comparison-dialog.component';

// ── Taxonomy ──────────────────────────────────────────────────────────────────
export * from './lib/taxonomy/taxonomy-page.component';
export * from './lib/taxonomy/series-form.component';

// ── Shared editor layout ──────────────────────────────────────────────────────
export * from './lib/layout/admin-editor-page-layout.component';

// ── Editor sub-components ─────────────────────────────────────────────────────
export * from './lib/page-editor/links-editor-form.component';
export * from './lib/post-editor/post-editor-media-tab.component';
export * from './lib/post-editor/post-editor-cover-image.component';
export * from './lib/post-editor/post-editor-embedded-media.component';
export * from './lib/post-editor/post-editor-embedded-media-item.component';
export * from './lib/post-editor/post-publish-button/post-publish-button.component';

// ── Posts list ────────────────────────────────────────────────────────────────
export * from './lib/posts-list/posts-board.component';
export * from './lib/posts-list/posts-draft-column.component';
export * from './lib/posts-list/posts-queue-column.component';
export * from './lib/posts-list/posts-published-column.component';
export * from './lib/posts-list/posts-list.component';
export * from './lib/posts-list/posts-table.component';

// ── Shared UI ─────────────────────────────────────────────────────────────────
export * from './lib/shared/confirm-dialog/confirm-dialog.component';
export * from './lib/shared/empty-state/empty-state.component';
