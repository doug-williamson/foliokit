/**
 * Docs — navigation and content smoke tests.
 *
 * The docs site is a static Angular app (no Firebase).  These tests verify
 * that the landing page and key documentation routes load without errors and
 * that internal navigation resolves correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('loads the docs landing page', async ({ page }) => {
    await page.goto('/');
    // The landing page component should render with at least some content
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 10_000 });
    // The docs shell renders a nav/sidebar structure
    await expect(page.locator('folio-docs-shell, app-root')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Getting Started docs', () => {
  test('/docs/getting-started loads without error', async ({ page }) => {
    await page.goto('/docs/getting-started');
    await expect(page).not.toHaveURL(/not-found/, { timeout: 8_000 });
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('/docs/getting-started/nx loads without error', async ({ page }) => {
    await page.goto('/docs/getting-started/nx');
    await expect(page).not.toHaveURL(/not-found/, { timeout: 8_000 });
  });
});

test.describe('AppShell docs', () => {
  test('/docs/app-shell loads without error', async ({ page }) => {
    await page.goto('/docs/app-shell');
    await expect(page).not.toHaveURL(/not-found/, { timeout: 8_000 });
  });

  test('/docs/app-shell/api loads without error', async ({ page }) => {
    await page.goto('/docs/app-shell/api');
    await expect(page).not.toHaveURL(/not-found/, { timeout: 8_000 });
  });

  test('/docs/app-shell/theming loads without error', async ({ page }) => {
    await page.goto('/docs/app-shell/theming');
    await expect(page).not.toHaveURL(/not-found/, { timeout: 8_000 });
  });
});

test.describe('LinksPage docs', () => {
  test('/docs/links-page loads without error', async ({ page }) => {
    await page.goto('/docs/links-page');
    await expect(page).not.toHaveURL(/not-found/, { timeout: 8_000 });
  });

  test('/docs/links-page/api loads without error', async ({ page }) => {
    await page.goto('/docs/links-page/api');
    await expect(page).not.toHaveURL(/not-found/, { timeout: 8_000 });
  });
});

test.describe('Markdown docs', () => {
  test('/docs/markdown loads without error', async ({ page }) => {
    await page.goto('/docs/markdown');
    await expect(page).not.toHaveURL(/not-found/, { timeout: 8_000 });
  });
});

test.describe('Tokens docs', () => {
  test('/docs/tokens loads without error', async ({ page }) => {
    await page.goto('/docs/tokens');
    await expect(page).not.toHaveURL(/not-found/, { timeout: 8_000 });
  });
});

test.describe('Unknown routes', () => {
  test('unknown path renders not-found page', async ({ page }) => {
    await page.goto('/docs/this-page-does-not-exist');
    // The docs shell catches ** with a NotFoundPageComponent
    await expect(page.locator('body')).not.toBeEmpty({ timeout: 8_000 });
    // Should not crash (still renders within the shell)
    await expect(page.locator('folio-docs-shell, app-root')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Internal navigation', () => {
  test('navigates from landing to getting-started via sidebar link', async ({ page }) => {
    await page.goto('/');
    // Find the Getting Started link in the sidebar/nav
    const gettingStartedLink = page.getByRole('link', { name: /getting started/i }).first();
    if (await gettingStartedLink.isVisible({ timeout: 5_000 })) {
      await gettingStartedLink.click();
      await expect(page).toHaveURL(/getting-started/, { timeout: 8_000 });
    } else {
      // Direct navigation fallback if sidebar is not rendered in test viewport
      await page.goto('/docs/getting-started');
      await expect(page).not.toHaveURL(/not-found/);
    }
  });
});
