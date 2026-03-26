/**
 * Blog — Links page tests.
 *
 * Pain-point coverage: exercises all paths through featureGuard('links')
 * and linksPageResolver:
 *
 *   1. Enabled + links present  → page renders link items
 *   2. Enabled = false           → redirects to /not-found
 *   3. Enabled = true, links = [] → redirects to /not-found
 *
 * Mirrors the structure of about.spec.ts.
 */

import { test, expect } from '@playwright/test';
import {
  reseedFirestore,
  setLinksEnabled,
  clearLinks,
} from '../../e2e-shared/firestore-helpers';

test.beforeEach(async () => {
  await reseedFirestore();
});

test.describe('Links page — enabled and populated', () => {
  test('renders the links page with seeded links', async ({ page }) => {
    await page.goto('/links');
    // The seed contains "My Blog", "GitHub", "Bluesky", "Twitter / X" links
    await expect(page.getByText('My Blog')).toBeVisible({ timeout: 12_000 });
    await expect(page.getByText('GitHub')).toBeVisible();
    await expect(page.getByText('Bluesky')).toBeVisible();
  });

  test('renders the headline from seed data', async ({ page }) => {
    await page.goto('/links');
    await expect(page.getByText('Dev Author')).toBeVisible({ timeout: 10_000 });
  });

  test('link items are clickable anchors', async ({ page }) => {
    await page.goto('/links');
    await expect(page.getByRole('link', { name: 'My Blog' })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Links page — featureGuard and resolver redirects', () => {
  test('redirects to /not-found when pages.links.enabled is false', async ({ page }) => {
    await setLinksEnabled(false);
    await page.goto('/links');
    await expect(page).toHaveURL(/not-found/, { timeout: 12_000 });
  });

  test('redirects to /not-found when links array is empty', async ({ page }) => {
    await clearLinks();
    await page.goto('/links');
    await expect(page).toHaveURL(/not-found/, { timeout: 12_000 });
  });
});
