/**
 * Integration — Admin Links Page → Blog Links Page pipeline.
 *
 * Data path under test:
 *   Admin UI → SiteConfigEditorStore.save() → Firestore
 *     → ServerSiteConfigService (Admin SDK) → SSR renderer → Blog /links
 */

import { test, expect } from '@playwright/test';
import { reseedFirestore } from '../../../e2e-shared/firestore-helpers';

const BLOG_BASE = 'http://localhost:4201';
const UNIQUE_LINK_LABEL = `Integration Link ${Date.now()}`;

test.beforeEach(async () => {
  await reseedFirestore();
});

test('admin adds a new link → blog /links shows it', async ({ page }) => {
  // ── Step 1: Admin — add a link ───────────────────────────────────────────
  await page.goto('/links-page');
  await expect(page.getByRole('button', { name: /add link/i })).toBeVisible({ timeout: 12_000 });

  await page.getByRole('button', { name: /add link/i }).click();

  const labelInputs = page.getByLabel('Label');
  const lastLabel = labelInputs.last();
  await expect(lastLabel).toBeVisible({ timeout: 5_000 });
  await lastLabel.fill(UNIQUE_LINK_LABEL);
  await page.getByLabel('URL').last().fill('https://integration-test.example.com');

  await page.getByRole('button', { name: /save changes/i }).click();
  await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.text-red-500')).not.toBeVisible();

  // ── Step 2: Blog — verify the link is visible ────────────────────────────
  const blogPage = await page.context().newPage();
  await blogPage.goto(`${BLOG_BASE}/links`);
  await expect(blogPage.getByText(UNIQUE_LINK_LABEL)).toBeVisible({ timeout: 15_000 });
  await blogPage.close();
});

test('admin disables links page → blog /links redirects to /not-found', async ({ page }) => {
  // ── Step 1: Admin — disable the Links page ───────────────────────────────
  await page.goto('/links-page');
  await expect(page.getByRole('heading', { name: 'Links Page' })).toBeVisible({ timeout: 12_000 });

  const enableToggle = page.locator('mat-slide-toggle').filter({ hasText: /enable/i }).first();
  const toggleClass = await enableToggle.getAttribute('class');
  if (toggleClass?.includes('mat-mdc-slide-toggle-checked')) {
    await enableToggle.click();
  }

  await page.getByRole('button', { name: /save changes/i }).click();
  await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });

  // ── Step 2: Blog — /links should redirect to /not-found ──────────────────
  const blogPage = await page.context().newPage();
  await blogPage.goto(`${BLOG_BASE}/links`);
  await expect(blogPage).toHaveURL(/not-found/, { timeout: 12_000 });
  await blogPage.close();
});
