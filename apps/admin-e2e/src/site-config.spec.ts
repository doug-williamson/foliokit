/**
 * Admin — Site Config tests.
 */

import { test, expect } from '@playwright/test';
import { reseedFirestore } from '../../e2e-shared/firestore-helpers';

test.beforeEach(async () => {
  await reseedFirestore();
});

test.describe('Site Config editor', () => {
  test('loads Site Config with seeded site name', async ({ page }) => {
    await page.goto('/site-config');
    await expect(page.getByRole('heading', { name: /site config/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel(/site name/i)).toHaveValue('FolioKit Blog', { timeout: 8_000 });
  });

  test('edits site name, saves, and change persists after reload', async ({ page }) => {
    await page.goto('/site-config');
    await expect(page.getByLabel(/site name/i)).toBeVisible({ timeout: 10_000 });

    await page.getByLabel(/site name/i).fill('E2E Site Name');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saving/i)).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();

    await page.reload();
    await expect(page.getByLabel(/site name/i)).toHaveValue('E2E Site Name', { timeout: 8_000 });
  });

  test('edits site URL and saves', async ({ page }) => {
    await page.goto('/site-config');
    await expect(page.getByLabel(/site url/i)).toBeVisible({ timeout: 10_000 });

    await page.getByLabel(/site url/i).fill('https://e2e-test.example.com');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saving/i)).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();
  });
});
