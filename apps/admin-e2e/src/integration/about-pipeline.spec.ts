/**
 * Integration — Admin About Page → Blog About Page pipeline.
 *
 * This is the highest-value test in the suite: it writes data through the
 * Admin UI and then verifies it appears on the blog, exercising the full
 * data path:
 *
 *   Admin UI → SiteConfigEditorStore.save() → Firestore
 *     → ServerSiteConfigService (Admin SDK) → SSR renderer → Blog /about
 *
 * The admin tests run against http://localhost:4203 (base URL from config).
 * Blog assertions use a direct URL on http://localhost:4201.
 *
 * Prerequisites: both webServers must be running (both are declared in
 * playwright.config.ts for admin-e2e).
 */

import { test, expect } from '@playwright/test';
import { reseedFirestore } from '../../../e2e-shared/firestore-helpers';

const BLOG_BASE = 'http://localhost:4201';
const UNIQUE_HEADLINE = `Integration About Headline ${Date.now()}`;

test.beforeEach(async () => {
  await reseedFirestore();
});

test('admin saves a new about headline → blog /about reflects it', async ({ page }) => {
  // ── Step 1: Admin — update the About Page headline ──────────────────────
  await page.goto('/about-page');
  await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 12_000 });

  await page.getByLabel('Headline').fill(UNIQUE_HEADLINE);

  // Ensure the enabled toggle is on (seeded as true, but be explicit)
  const enableToggle = page.locator('mat-slide-toggle').filter({ hasText: /enable/i }).first();
  const toggleChecked = await enableToggle.getAttribute('class');
  if (toggleChecked && !toggleChecked.includes('mat-mdc-slide-toggle-checked')) {
    await enableToggle.click();
  }

  await page.getByRole('button', { name: /save changes/i }).click();
  await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.text-red-500')).not.toBeVisible();

  // ── Step 2: Blog — verify the headline appears ───────────────────────────
  // SSR reads Firestore fresh on each request, so no cache-busting needed.
  // We open the blog in a new context using the absolute URL.
  const blogPage = await page.context().newPage();
  await blogPage.goto(`${BLOG_BASE}/about`);
  await expect(blogPage.getByRole('heading', { name: UNIQUE_HEADLINE })).toBeVisible({
    timeout: 15_000,
  });
  await blogPage.close();
});

test('admin disables about page → blog /about redirects to /not-found', async ({ page }) => {
  // ── Step 1: Admin — disable the About page ───────────────────────────────
  await page.goto('/about-page');
  await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 12_000 });

  const enableToggle = page.locator('mat-slide-toggle').filter({ hasText: /enable/i }).first();
  // Ensure it's currently enabled (click only if not already disabled)
  const toggleClass = await enableToggle.getAttribute('class');
  if (toggleClass?.includes('mat-mdc-slide-toggle-checked')) {
    await enableToggle.click();
  }

  await page.getByRole('button', { name: /save changes/i }).click();
  await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });

  // ── Step 2: Blog — /about should redirect to /not-found ──────────────────
  const blogPage = await page.context().newPage();
  await blogPage.goto(`${BLOG_BASE}/about`);
  await expect(blogPage).toHaveURL(/not-found/, { timeout: 12_000 });
  await blogPage.close();
});
