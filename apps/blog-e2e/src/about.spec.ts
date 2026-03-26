/**
 * Blog — About page tests.
 *
 * Pain-point coverage: exercises all paths through featureGuard('about')
 * and aboutPageResolver:
 *
 *   1. Enabled + bio populated  → page renders correctly
 *   2. Enabled = false           → redirects to /not-found
 *   3. Enabled = true, bio = ''  → redirects to /not-found
 *
 * Firestore state is patched before each test via the Admin SDK helpers and
 * restored to seed data in the beforeEach.
 */

import { test, expect } from '@playwright/test';
import {
  reseedFirestore,
  setAboutEnabled,
  setAboutBio,
} from '../../e2e-shared/firestore-helpers';

// Restore seed state before each test so tests are independent.
test.beforeEach(async () => {
  await reseedFirestore();
});

test.describe('About page — enabled and populated', () => {
  test('renders the about page with headline from seed data', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /hey, i'm dev author/i })).toBeVisible({
      timeout: 12_000,
    });
  });

  test('renders bio content', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText(/i build things for the web/i)).toBeVisible({ timeout: 10_000 });
  });

  test('renders social links', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('link', { name: /github/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /bluesky/i })).toBeVisible();
  });
});

test.describe('About page — featureGuard and resolver redirects', () => {
  test('redirects to /not-found when pages.about.enabled is false', async ({ page }) => {
    await setAboutEnabled(false);
    await page.goto('/about');
    await expect(page).toHaveURL(/not-found/, { timeout: 12_000 });
  });

  test('redirects to /not-found when bio is empty (resolver guard)', async ({ page }) => {
    await setAboutBio('');
    await page.goto('/about');
    await expect(page).toHaveURL(/not-found/, { timeout: 12_000 });
  });

  test('redirects to /not-found when bio is whitespace only', async ({ page }) => {
    await setAboutBio('   ');
    await page.goto('/about');
    await expect(page).toHaveURL(/not-found/, { timeout: 12_000 });
  });
});
