/**
 * Admin — Authors CRUD tests.
 */

import { test, expect } from '@playwright/test';
import { reseedFirestore } from '../../e2e-shared/firestore-helpers';

test.beforeEach(async () => {
  await reseedFirestore();
});

test.describe('Authors list', () => {
  test('shows Authors heading and seeded author', async ({ page }) => {
    await page.goto('/authors');
    await expect(page.getByRole('heading', { name: 'Authors' })).toBeVisible({ timeout: 10_000 });
    // Seeded author: Dev Author
    await expect(page.getByText('Dev Author')).toBeVisible({ timeout: 8_000 });
  });

  test('shows New Author button', async ({ page }) => {
    await page.goto('/authors');
    await expect(page.getByRole('button', { name: /new author/i })).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Author form — create', () => {
  test('navigates to new author form and fills display name', async ({ page }) => {
    await page.goto('/authors');
    await page.getByRole('button', { name: /new author/i }).click();
    await expect(page).toHaveURL(/\/authors\/new/, { timeout: 8_000 });
    await expect(page.getByLabel(/display name/i)).toBeVisible({ timeout: 8_000 });

    await page.getByLabel(/display name/i).fill('E2E Test Author');

    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/authors$/, { timeout: 10_000 });
    await expect(page.getByText('E2E Test Author')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Author form — edit', () => {
  test('edits existing author display name and saves', async ({ page }) => {
    await page.goto('/authors');
    // Click the edit button for the seeded author
    await expect(page.getByText('Dev Author')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /edit/i }).first().click();
    await expect(page).toHaveURL(/\/authors\/.+\/edit/, { timeout: 8_000 });

    await page.getByLabel(/display name/i).fill('Dev Author Updated');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/authors$/, { timeout: 10_000 });
    await expect(page.getByText('Dev Author Updated')).toBeVisible({ timeout: 8_000 });
  });
});
