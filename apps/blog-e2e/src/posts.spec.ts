/**
 * Blog — Posts list and post detail tests.
 *
 * Verifies that seeded published posts appear in the list and that individual
 * post detail pages render the expected content.
 */

import { test, expect } from '@playwright/test';

test.describe('Posts list page (/posts)', () => {
  test('shows the seeded published posts', async ({ page }) => {
    await page.goto('/posts');
    await expect(page.getByText('Hello World')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Angular Signals Deep Dive')).toBeVisible();
  });

  test('does not show draft or scheduled posts', async ({ page }) => {
    await page.goto('/posts');
    // Wait for list to load
    await expect(page.getByText('Hello World')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('NgRx Signals Store Patterns')).not.toBeVisible();
    await expect(page.getByText('Tailwind v4 First Look')).not.toBeVisible();
  });
});

test.describe('Post detail page (/posts/:slug)', () => {
  test('navigates to Hello World post detail', async ({ page }) => {
    await page.goto('/posts');
    await page.getByText('Hello World').click();
    await expect(page).toHaveURL(/\/posts\/hello-world/, { timeout: 8_000 });
    await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible({ timeout: 8_000 });
  });

  test('renders post content (markdown body)', async ({ page }) => {
    await page.goto('/posts/hello-world');
    // Seeded content includes "Lorem ipsum" text
    await expect(page.getByText(/lorem ipsum/i)).toBeVisible({ timeout: 8_000 });
  });

  test('navigates to Angular Signals Deep Dive post detail', async ({ page }) => {
    await page.goto('/posts/angular-signals');
    await expect(page.getByRole('heading', { name: 'Angular Signals Deep Dive' })).toBeVisible({
      timeout: 8_000,
    });
  });

  test('non-existent slug shows not-found page', async ({ page }) => {
    await page.goto('/posts/this-slug-does-not-exist');
    await expect(page).toHaveURL(/not-found/, { timeout: 8_000 });
  });
});
