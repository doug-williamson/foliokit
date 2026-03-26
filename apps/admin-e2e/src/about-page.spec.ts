/**
 * Admin — About Page editor tests.
 *
 * Pain-point coverage: verifies that the About Page editor correctly reads
 * from and writes to Firestore (site-config/default pages.about), and that
 * the enabled toggle propagates as expected.
 */

import { test, expect } from '@playwright/test';
import { getAboutEnabled, reseedFirestore } from '../../e2e-shared/firestore-helpers';

// Restore seed data before each test so state is predictable.
test.beforeEach(async () => {
  await reseedFirestore();
});

test.describe('About Page editor — initial load', () => {
  test('loads the About Page editor with seeded data', async ({ page }) => {
    await page.goto('/about-page');
    // Wait for config to load (spinner should disappear)
    await expect(page.getByRole('heading', { name: 'About Page' })).toBeVisible({ timeout: 10_000 });
    // Seeded headline should be populated in the form
    await expect(page.getByLabel('Headline')).toHaveValue("Hey, I'm Dev Author", { timeout: 8_000 });
  });

  test('bio textarea is populated with seeded bio', async ({ page }) => {
    await page.goto('/about-page');
    await expect(page.getByLabel('Bio')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByLabel('Bio')).not.toHaveValue('');
  });
});

test.describe('About Page editor — editing and saving', () => {
  test('edits headline and saves — no error banner shown', async ({ page }) => {
    await page.goto('/about-page');
    const headlineField = page.getByLabel('Headline');
    await expect(headlineField).toBeVisible({ timeout: 10_000 });

    await headlineField.fill('Updated Headline E2E');
    await page.getByRole('button', { name: /save changes/i }).click();

    // Saving… indicator appears then disappears; no error should be shown
    await expect(page.getByText('Saving…')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();
  });

  test('edits bio and saves successfully', async ({ page }) => {
    await page.goto('/about-page');
    const bioField = page.getByLabel('Bio');
    await expect(bioField).toBeVisible({ timeout: 10_000 });

    await bioField.fill('Updated bio content for e2e test.');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();
  });

  test('saved changes persist after page reload', async ({ page }) => {
    await page.goto('/about-page');
    await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 10_000 });

    await page.getByLabel('Headline').fill('Persistent Headline E2E');
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });

    // Reload and verify the change persisted
    await page.reload();
    await expect(page.getByLabel('Headline')).toHaveValue('Persistent Headline E2E', {
      timeout: 10_000,
    });
  });
});

test.describe('About Page editor — enabled toggle', () => {
  test('toggling enabled off saves false to Firestore', async ({ page }) => {
    await page.goto('/about-page');
    await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 10_000 });

    // The "Enable About Page" toggle — seeded as enabled: true
    const enableToggle = page.locator('mat-slide-toggle').filter({ hasText: /enable/i }).first();
    await expect(enableToggle).toBeVisible({ timeout: 5_000 });
    await enableToggle.click();

    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });

    // Verify Firestore via Admin SDK
    const enabled = await getAboutEnabled();
    expect(enabled).toBe(false);
  });

  test('toggling enabled back on saves true to Firestore', async ({ page }) => {
    // Seed has enabled: true — toggle off, save, toggle on, save
    await page.goto('/about-page');
    await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 10_000 });

    const enableToggle = page.locator('mat-slide-toggle').filter({ hasText: /enable/i }).first();

    // Toggle off
    await enableToggle.click();
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });

    // Toggle back on
    await enableToggle.click();
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });

    const enabled = await getAboutEnabled();
    expect(enabled).toBe(true);
  });
});

test.describe('About Page editor — social links', () => {
  test('existing seeded social links are visible', async ({ page }) => {
    await page.goto('/about-page');
    await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 10_000 });
    // Seeded social links: GitHub, Bluesky, Twitter / X
    await expect(page.getByText('GitHub')).toBeVisible({ timeout: 8_000 });
  });

  test('adds a new social link and saves', async ({ page }) => {
    await page.goto('/about-page');
    await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 10_000 });

    // Click the "Add Social Link" button
    await page.getByRole('button', { name: /add social link/i }).click();

    // A new row should appear — fill in the URL for the last entry
    const urlInputs = page.getByPlaceholder(/https:\/\//i);
    const lastUrlInput = urlInputs.last();
    await expect(lastUrlInput).toBeVisible({ timeout: 5_000 });
    await lastUrlInput.fill('https://linkedin.com/in/dev-author-e2e');

    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();
  });

  test('removes a social link and saves', async ({ page }) => {
    await page.goto('/about-page');
    await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 10_000 });

    // Count social link remove buttons before
    const removeButtons = page.getByRole('button', { name: /remove/i });
    const countBefore = await removeButtons.count();
    if (countBefore === 0) {
      test.skip();
    }

    await removeButtons.first().click();
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();
  });
});

test.describe('About Page editor — unsaved changes guard', () => {
  test('navigating away with unsaved changes shows confirm dialog', async ({ page }) => {
    await page.goto('/about-page');
    await expect(page.getByLabel('Headline')).toBeVisible({ timeout: 10_000 });

    // Dirty the form
    await page.getByLabel('Headline').fill('Dirty — unsaved');

    let dialogShown = false;
    page.on('dialog', (dialog) => {
      dialogShown = true;
      dialog.dismiss();
    });

    await page.getByRole('link', { name: /posts/i }).first().click();
    await expect(() => expect(dialogShown).toBe(true)).toPass({ timeout: 3_000 });
  });

  test('Cancel button reverts unsaved changes', async ({ page }) => {
    await page.goto('/about-page');
    const headlineField = page.getByLabel('Headline');
    await expect(headlineField).toBeVisible({ timeout: 10_000 });

    const original = await headlineField.inputValue();
    await headlineField.fill('Dirty value that should be discarded');

    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(headlineField).toHaveValue(original, { timeout: 5_000 });
  });
});
