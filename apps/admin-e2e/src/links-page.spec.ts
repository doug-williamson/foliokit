/**
 * Admin — Links Page editor tests.
 *
 * Pain-point coverage: verifies that the Links Page editor correctly reads
 * from and writes to Firestore (site-config/default pages.links), that links
 * can be added/removed, and that the enabled toggle propagates correctly.
 */

import { test, expect } from '@playwright/test';
import { getLinksEnabled, reseedFirestore } from '../../e2e-shared/firestore-helpers';

// Restore seed data before each test.
test.beforeEach(async () => {
  await reseedFirestore();
});

test.describe('Links Page editor — initial load', () => {
  test('loads the Links Page editor with seeded links', async ({ page }) => {
    await page.goto('/links-page');
    await expect(page.getByRole('heading', { name: 'Links Page' })).toBeVisible({ timeout: 10_000 });
    // Seeded links: My Blog, GitHub, Bluesky, Twitter / X
    await expect(page.getByText('My Blog')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('GitHub')).toBeVisible();
  });

  test('shows Headline field with seeded value', async ({ page }) => {
    await page.goto('/links-page');
    await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByLabel('Headline')).toHaveValue('Dev Author');
  });
});

test.describe('Links Page editor — adding and editing links', () => {
  test('adds a new link and saves — link appears after reload', async ({ page }) => {
    await page.goto('/links-page');
    await expect(page.getByRole('button', { name: /add link/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /add link/i }).click();

    // A new link row appears — fill in the Label field of the last row
    const labelInputs = page.getByLabel('Label');
    const lastLabel = labelInputs.last();
    await expect(lastLabel).toBeVisible({ timeout: 5_000 });
    await lastLabel.fill('E2E New Link');

    const urlInputs = page.getByLabel('URL');
    await urlInputs.last().fill('https://example-e2e.com');

    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();

    // Reload and verify the link persists
    await page.reload();
    await expect(page.getByText('E2E New Link')).toBeVisible({ timeout: 8_000 });
  });

  test('edits an existing link URL and saves', async ({ page }) => {
    await page.goto('/links-page');
    await expect(page.getByText('My Blog')).toBeVisible({ timeout: 10_000 });

    // The first URL input corresponds to the "My Blog" link
    const urlInputs = page.getByLabel('URL');
    await urlInputs.first().fill('https://updated-blog-url.com');

    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();

    // Reload and verify the updated URL persists
    await page.reload();
    await expect(urlInputs.first()).toHaveValue('https://updated-blog-url.com', {
      timeout: 8_000,
    });
  });

  test('deletes a link and saves — link absent after reload', async ({ page }) => {
    await page.goto('/links-page');
    await expect(page.getByText('Twitter / X')).toBeVisible({ timeout: 10_000 });

    // Count delete buttons before
    const deleteButtons = page.getByRole('button', { name: /delete link/i });
    await expect(deleteButtons.first()).toBeVisible({ timeout: 5_000 });

    // Delete the last link (Twitter / X)
    const count = await deleteButtons.count();
    await deleteButtons.nth(count - 1).click();

    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });

    // After reload Twitter / X should be gone
    await page.reload();
    await expect(page.getByText('Twitter / X')).not.toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Links Page editor — enabled toggle', () => {
  test('toggling enabled off saves false to Firestore', async ({ page }) => {
    await page.goto('/links-page');
    await expect(page.getByRole('heading', { name: 'Links Page' })).toBeVisible({ timeout: 10_000 });

    // The Links editor form has a mat-slide-toggle for "Enable Links Page"
    const enableToggle = page.locator('mat-slide-toggle').filter({ hasText: /enable/i }).first();
    await expect(enableToggle).toBeVisible({ timeout: 5_000 });
    await enableToggle.click();

    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });

    const enabled = await getLinksEnabled();
    expect(enabled).toBe(false);
  });

  test('toggling enabled back on saves true to Firestore', async ({ page }) => {
    await page.goto('/links-page');
    await expect(page.getByRole('heading', { name: 'Links Page' })).toBeVisible({ timeout: 10_000 });

    const enableToggle = page.locator('mat-slide-toggle').filter({ hasText: /enable/i }).first();

    // Toggle off
    await enableToggle.click();
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });

    // Toggle back on
    await enableToggle.click();
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });

    const enabled = await getLinksEnabled();
    expect(enabled).toBe(true);
  });
});

test.describe('Links Page editor — unsaved changes guard', () => {
  test('navigating away with unsaved changes shows confirm dialog', async ({ page }) => {
    await page.goto('/links-page');
    await expect(page.getByRole('button', { name: /add link/i })).toBeVisible({ timeout: 10_000 });

    // Dirty the form by adding a link
    await page.getByRole('button', { name: /add link/i }).click();

    let dialogShown = false;
    page.on('dialog', (dialog) => {
      dialogShown = true;
      dialog.dismiss();
    });

    await page.getByRole('link', { name: /posts/i }).first().click();
    await expect(() => expect(dialogShown).toBe(true)).toPass({ timeout: 3_000 });
  });

  test('Cancel button reverts unsaved changes', async ({ page }) => {
    await page.goto('/links-page');
    await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 10_000 });

    await page.getByLabel('Headline').fill('Dirty headline');
    await page.getByRole('button', { name: /cancel/i }).click();

    // After cancel, headline should revert to seeded value
    await expect(page.getByLabel('Headline')).toHaveValue('Dev Author', { timeout: 5_000 });
  });
});
