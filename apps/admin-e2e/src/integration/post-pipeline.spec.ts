/**
 * Integration — Admin Post publish → Blog Posts list pipeline.
 *
 * Data path under test:
 *   Admin UI → PostEditorStore.publish() → Firestore
 *     → ServerBlogPostService (Admin SDK) → SSR renderer → Blog /posts
 */

import { test, expect } from '@playwright/test';
import { reseedFirestore } from '../../../e2e-shared/firestore-helpers';

const BLOG_BASE = 'http://localhost:4201';
const UNIQUE_TITLE = `Integration Post ${Date.now()}`;
const UNIQUE_SLUG = `integration-post-${Date.now()}`;

test.beforeEach(async () => {
  await reseedFirestore();
});

test('admin publishes a new post → blog /posts list shows it', async ({ page }) => {
  // ── Step 1: Admin — create and publish a post ────────────────────────────
  await page.goto('/posts/new');
  await expect(page.getByLabel('Title')).toBeVisible({ timeout: 12_000 });

  await page.getByLabel('Title').fill(UNIQUE_TITLE);

  // Switch to Metadata tab and fill the required slug
  await page.getByRole('tab', { name: 'Metadata' }).click();
  await expect(page.getByLabel('Slug')).toBeVisible({ timeout: 5_000 });
  await page.getByLabel('Slug').fill(UNIQUE_SLUG);

  // Publish the post
  await page.getByRole('button', { name: /^publish$/i }).click();
  await expect(page.getByText('Saved')).toBeVisible({ timeout: 12_000 });

  // ── Step 2: Blog — verify the post appears in the list ───────────────────
  const blogPage = await page.context().newPage();
  await blogPage.goto(`${BLOG_BASE}/posts`);
  await expect(blogPage.getByText(UNIQUE_TITLE)).toBeVisible({ timeout: 15_000 });

  // ── Step 3: Blog — click through to post detail ──────────────────────────
  await blogPage.getByText(UNIQUE_TITLE).click();
  await expect(blogPage).toHaveURL(new RegExp(UNIQUE_SLUG), { timeout: 8_000 });
  await expect(blogPage.getByRole('heading', { name: UNIQUE_TITLE })).toBeVisible({
    timeout: 8_000,
  });
  await blogPage.close();
});
