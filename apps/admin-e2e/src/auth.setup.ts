/**
 * Auth setup project — runs once before all admin-e2e test projects.
 *
 * Signs into the admin app via the Firebase Auth Emulator popup and saves
 * the resulting browser storageState to `.auth/admin.json`.  All subsequent
 * test projects reuse this storageState so they start pre-authenticated.
 *
 * How the Firebase Auth Emulator popup works:
 *   When `signInWithPopup` is called with the emulator active, Firebase
 *   opens a popup window at http://localhost:9099/emulator/auth/handler.
 *   That page lists existing Auth emulator users and lets you sign in as
 *   one of them with a single click.  The seeded user is:
 *     email: dev.foliokit@gmail.com  (uid: admin-dev)
 *
 * Debugging tip: if this test fails, set `headless: false` in
 * `playwright.config.ts` and watch the popup interaction manually.
 * A screenshot is saved to `dist/e2e-debug-auth-popup.png` on failure.
 */

import * as path from 'path';
import { test as setup, expect } from '@playwright/test';

const ADMIN_EMAIL = 'dev.foliokit@gmail.com';
const ADMIN_STORAGE_STATE = path.join(__dirname, '..', '.auth', 'admin.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/login');

  // Wait for the Angular app to bootstrap and the button to appear.
  const signInButton = page.getByRole('button', { name: /sign in with google/i });
  await expect(signInButton).toBeVisible({ timeout: 15_000 });

  // Capture the popup before clicking so we don't miss it.
  const popupPromise = page.waitForEvent('popup');
  await signInButton.click();
  const popup = await popupPromise;

  await popup.waitForLoadState('domcontentloaded');

  console.log('[auth.setup] Emulator popup URL:', popup.url());

  // The Firebase Auth Emulator popup shows imported users as clickable elements.
  // We try multiple selector patterns for resilience across emulator versions.
  const selectors = [
    `a:has-text("${ADMIN_EMAIL}")`,
    `button:has-text("${ADMIN_EMAIL}")`,
    `[data-testid*="${ADMIN_EMAIL}"]`,
    `li:has-text("${ADMIN_EMAIL}")`,
    `td:has-text("${ADMIN_EMAIL}")`,
  ];

  let clicked = false;
  for (const selector of selectors) {
    const el = popup.locator(selector).first();
    if (await el.count() > 0) {
      await el.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    // Capture popup HTML to help debug selector mismatches.
    const html = await popup.content();
    await popup.screenshot({ path: 'dist/e2e-debug-auth-popup.png' }).catch(() => null);
    throw new Error(
      `[auth.setup] Could not find "${ADMIN_EMAIL}" in Firebase Auth Emulator popup.\n` +
        `Popup URL: ${popup.url()}\n` +
        `Popup HTML (first 2000 chars):\n${html.slice(0, 2000)}`,
    );
  }

  // Wait for the redirect to /dashboard that happens after successful sign-in.
  await page.waitForURL('**/dashboard', { timeout: 20_000 });

  // Persist the authenticated browser state for all downstream test projects.
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
  console.log('[auth.setup] Admin storageState saved to', ADMIN_STORAGE_STATE);
});
