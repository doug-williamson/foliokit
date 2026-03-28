/**
 * Full Admin → Blog Simulation
 *
 * A self-contained, stateful end-to-end walkthrough that begins at the login
 * page and walks every admin page in order to build up a complete data set,
 * then verifies every change is visible on the blog in one connected flow.
 *
 * Unlike the isolated integration specs, Firestore is seeded once at the
 * start and never reset mid-test — state accumulates across the whole
 * simulation.
 *
 * Steps covered:
 *   /login          → sign in via Firebase Auth emulator popup
 *   /site-config    → update site name
 *   /authors/new    → create a new author
 *   /posts/new      → create and publish a post
 *   /pages/about    → set headline and save
 *   /pages/links    → add a new link and save
 *
 * Blog pages verified (single new tab, no reloads):
 *   /posts          → new post title visible (slug field removed from editor,
 *                     so detail-page URL navigation is not tested here)
 *   /about          → updated headline visible
 *   /links          → new link label visible
 */

import { test, expect } from '@playwright/test';
import { reseedFirestore, readDoc } from '../../../e2e-shared/firestore-helpers';

const ADMIN_EMAIL = 'dev.foliokit@gmail.com';
const BLOG_BASE = 'http://localhost:4201';
const TS = Date.now();

const SIM_SITE_NAME      = `Simulation Blog ${TS}`;
const SIM_AUTHOR_NAME    = `Simulation Author ${TS}`;
const SIM_POST_TITLE     = `Simulation Post ${TS}`;
const SIM_ABOUT_HEADLINE = `Simulation About ${TS}`;
const SIM_LINK_LABEL     = `Simulation Link ${TS}`;
const SIM_LINK_URL       = 'https://simulation.example.com';

// Start with a clean browser context so the simulation handles its own sign-in
// rather than relying on a persisted storageState (Firebase Auth uses IndexedDB
// which is not captured by Playwright's storageState mechanism).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('full simulation', () => {
  test.beforeAll(async () => {
    await reseedFirestore();
  });

  test('walks every admin page and verifies all changes on the blog', async ({ page }) => {
    // ── 0. Sign in via Firebase Auth emulator popup ─────────────────────────
    await page.goto('/login');
    const signInButton = page.getByRole('button', { name: /sign in with google/i });
    await expect(signInButton).toBeVisible({ timeout: 15_000 });

    const popupPromise = page.waitForEvent('popup');
    await signInButton.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');

    const popupSelectors = [
      `a:has-text("${ADMIN_EMAIL}")`,
      `button:has-text("${ADMIN_EMAIL}")`,
      `li:has-text("${ADMIN_EMAIL}")`,
      `td:has-text("${ADMIN_EMAIL}")`,
      `[data-testid*="${ADMIN_EMAIL}"]`,
    ];
    let clicked = false;
    for (const selector of popupSelectors) {
      const el = popup.locator(selector).first();
      if ((await el.count()) > 0) {
        await el.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      throw new Error(
        `[simulation] Could not find "${ADMIN_EMAIL}" in Firebase Auth Emulator popup.\n` +
          `Popup URL: ${popup.url()}\n` +
          `Popup HTML:\n${(await popup.content()).slice(0, 2000)}`,
      );
    }
    await page.waitForURL('**/posts', { timeout: 20_000 });

    // ── 1. Site Config ──────────────────────────────────────────────────────
    await page.goto('/site-config');
    await expect(page.getByRole('heading', { name: /site config/i })).toBeVisible({
      timeout: 12_000,
    });
    await page.getByLabel(/site name/i).fill(SIM_SITE_NAME);
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saving/i)).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();

    // ── 2. Authors — create a new author ───────────────────────────────────
    // Navigate via the list → New Author button so the router transition gives
    // the store→form sync interval (50ms) time to fire and set up the
    // valueChanges subscription before we fill the input.
    await page.goto('/authors');
    await page.getByRole('button', { name: /new author/i }).click();
    await expect(page).toHaveURL(/\/authors\/new/, { timeout: 8_000 });
    await expect(page.getByLabel(/display name/i)).toBeVisible({ timeout: 8_000 });
    // The AuthorEditorStore.initNew() is synchronous, so store.author() is
    // truthy immediately and the 50ms syncInterval fires almost right away.
    // Waiting 100ms ensures the interval has fired, patchValue has run, and the
    // valueChanges subscription is active before we fill — otherwise the sync
    // would overwrite our value and leave the Save button disabled.
    await page.waitForTimeout(100);
    await page.getByLabel(/display name/i).fill(SIM_AUTHOR_NAME);
    await expect(page.getByRole('button', { name: /save/i })).toBeEnabled({ timeout: 5_000 });
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/authors$/, { timeout: 10_000 });
    await expect(page.getByText(SIM_AUTHOR_NAME)).toBeVisible({ timeout: 8_000 });

    // ── 3. Posts — create and publish a new post ───────────────────────────
    // Note: the post editor no longer has a Slug field — the slug field was
    // removed and posts save with slug: '' by default.  Blog verification
    // therefore checks /posts list presence rather than a /posts/:slug URL.
    await page.goto('/posts/new');
    // Use exact:true — the editor also renders a "Subtitle" field whose label
    // contains "Title" as a substring, which would cause a strict mode error.
    const titleInput = page.getByRole('textbox', { name: 'Title', exact: true });
    await expect(titleInput).toBeVisible({ timeout: 12_000 });
    await titleInput.fill(SIM_POST_TITLE);
    await page.getByRole('button', { name: /^publish$/i }).click();
    await expect(page.getByText('Saved')).toBeVisible({ timeout: 12_000 });

    // ── 4. About Page — update headline, ensure enabled ────────────────────
    await page.goto('/pages/about');
    // Use exact:true — the about-page editor also has a "Subheadline" field
    // whose label contains "Headline" as a substring (strict mode violation).
    const headlineInput = page.getByRole('textbox', { name: 'Headline', exact: true });
    await expect(headlineInput).toBeVisible({ timeout: 12_000 });
    // AboutPageComponent.ngOnInit() starts a 50 ms poll that waits for
    // store.config() to become non-null, then calls populateForms() (which
    // patches the form with seed data including the required bio field) and
    // wires up watchForms().  The headline input is rendered as soon as
    // store.config() is truthy — *before* the poll fires.  Without this wait
    // populateForms() would overwrite whatever we just typed with the stale
    // seed headline, leaving the store non-dirty and the Save button disabled.
    // Identical pattern to the Authors step above.
    await page.waitForTimeout(100);
    await headlineInput.fill(SIM_ABOUT_HEADLINE);
    // Guard: confirm the Save button is actually enabled before clicking so
    // that a disabled-button silent no-op can never mask this class of bug.
    await expect(page.getByRole('button', { name: /save changes/i })).toBeEnabled({
      timeout: 5_000,
    });
    // The enable/disable toggle lives on /pages — not on the about editor.
    // The seed data has about: enabled: true, so no toggle
    // interaction is needed here.
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();
    // Confirm the headline was actually persisted to Firestore before the blog
    // navigates — rules out save timing as a source of flakiness.
    const configSnap = await readDoc('site-config', 'default');
    expect(configSnap?.['pages']?.about?.headline).toBe(SIM_ABOUT_HEADLINE);

    // ── 5. Links Page — add a new link, ensure enabled ─────────────────────
    await page.goto('/pages/links');
    await expect(page.getByRole('button', { name: /add link/i })).toBeVisible({ timeout: 12_000 });
    await page.getByRole('button', { name: /add link/i }).click();
    const lastLabel = page.getByLabel('Label').last();
    await expect(lastLabel).toBeVisible({ timeout: 5_000 });
    await lastLabel.fill(SIM_LINK_LABEL);
    await page.getByLabel('URL').last().fill(SIM_LINK_URL);
    // Enable toggle is on the /pages hub, not on the links editor — seed has links enabled.
    await page.getByRole('button', { name: /save changes/i }).click();
    await expect(page.getByText('Saving…')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.text-red-500')).not.toBeVisible();

    // ── 6. Blog verification ───────────────────────────────────────────────
    const blog = await page.context().newPage();

    // /posts → new post title visible (confirms admin→Firestore→SSR pipeline)
    await blog.goto(`${BLOG_BASE}/posts`);
    await expect(blog.getByText(SIM_POST_TITLE)).toBeVisible({ timeout: 15_000 });

    await blog.goto(`${BLOG_BASE}/about`);
    await expect(blog.getByRole('heading', { name: SIM_ABOUT_HEADLINE })).toBeVisible({
      timeout: 30_000,
    });

    await blog.goto(`${BLOG_BASE}/links`);
    await expect(blog.getByText(SIM_LINK_LABEL)).toBeVisible({ timeout: 15_000 });

    await blog.close();
  });
});
