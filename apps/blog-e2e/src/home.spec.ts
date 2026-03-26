/**
 * Blog — Home page tests.
 */

import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('loads the home page with the FolioKit Blog heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'FolioKit Blog' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Read Posts link navigates to /posts', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /read posts/i }).click();
    await expect(page).toHaveURL(/\/posts/, { timeout: 8_000 });
  });
});
