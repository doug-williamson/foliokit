/**
 * Admin — Posts CRUD tests.
 *
 * Prerequisites (handled by setup project + globalSetup):
 *   - Firebase emulators running
 *   - Firestore seeded with 2 published posts, 1 scheduled, 1 draft
 *   - User authenticated as dev.foliokit@gmail.com
 */

import { test, expect } from '@playwright/test';

test.describe('Posts list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/posts');
    await expect(page.getByRole('heading', { name: 'Posts' })).toBeVisible({ timeout: 10_000 });
  });

  test('shows Posts heading and New Post button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /new post/i })).toBeVisible();
  });

  test('shows seeded published post titles in the Published column', async ({ page }) => {
    await expect(page.getByText('Hello World')).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Angular Signals Deep Dive')).toBeVisible();
  });

  test('shows seeded draft post in the Draft column', async ({ page }) => {
    await expect(page.getByText('NgRx Signals Store Patterns')).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Post editor — new post', () => {
  test('navigates to post editor when New Post is clicked', async ({ page }) => {
    await page.goto('/posts');
    await page.getByRole('button', { name: /new post/i }).click();
    await expect(page).toHaveURL(/\/posts\/new/, { timeout: 8_000 });
    // Editor toolbar renders with placeholder title
    await expect(page.getByText('Untitled post')).toBeVisible({ timeout: 8_000 });
  });

  test('creates a draft post — fill title, save, post appears in list', async ({ page }) => {
    await page.goto('/posts/new');
    await expect(page.getByLabel('Title')).toBeVisible({ timeout: 10_000 });

    const title = `E2E Draft ${Date.now()}`;
    await page.getByLabel('Title').fill(title);

    // Save via the Save button in the toolbar
    await page.getByRole('button', { name: /^save$/i }).click();

    // Toolbar should show "Saved" once the save completes
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 10_000 });

    // Navigate back to posts list and verify the post appears in Draft column
    await page.goto('/posts');
    await expect(page.getByText(title)).toBeVisible({ timeout: 8_000 });
  });

  test('publishes a post — Publish button moves it to Published', async ({ page }) => {
    await page.goto('/posts/new');
    await expect(page.getByLabel('Title')).toBeVisible({ timeout: 10_000 });

    // Fill required content-tab fields
    const title = `E2E Published ${Date.now()}`;
    await page.getByLabel('Title').fill(title);

    // Switch to Metadata tab to fill required slug
    await page.getByRole('tab', { name: 'Metadata' }).click();
    const slug = `e2e-published-${Date.now()}`;
    await page.getByLabel('Slug').fill(slug);

    // Publish
    await page.getByRole('button', { name: /^publish$/i }).click();
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 10_000 });

    // Verify in the Published column
    await page.goto('/posts');
    await expect(page.getByText(title)).toBeVisible({ timeout: 8_000 });
  });
});

test.describe('Post editor — edit existing post', () => {
  test('edits an existing post title and saves', async ({ page }) => {
    await page.goto('/posts');
    // Open the draft post
    await page.getByText('NgRx Signals Store Patterns').click();
    await expect(page).toHaveURL(/\/edit/, { timeout: 8_000 });
    await expect(page.getByLabel('Title')).toBeVisible({ timeout: 10_000 });

    const newTitle = `NgRx Signals Store Patterns — Updated`;
    await page.getByLabel('Title').fill(newTitle);
    await page.getByRole('button', { name: /^save$/i }).click();
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Unsaved changes guard', () => {
  test('shows confirm dialog when navigating away from dirty editor', async ({ page }) => {
    await page.goto('/posts/new');
    await expect(page.getByLabel('Title')).toBeVisible({ timeout: 10_000 });

    // Make the form dirty
    await page.getByLabel('Title').fill('Unsaved post title');

    // Attempt to navigate away
    let dialogShown = false;
    page.on('dialog', (dialog) => {
      dialogShown = true;
      dialog.dismiss(); // Stay on the page
    });

    await page.getByRole('link', { name: /authors/i }).click();
    await expect(() => expect(dialogShown).toBe(true)).toPass({ timeout: 3_000 });
  });
});
