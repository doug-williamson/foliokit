/**
 * Blog — Server-Side Rendering smoke tests.
 *
 * These tests verify that key content is present in the raw HTML that the SSR
 * Express server sends BEFORE Angular hydrates in the browser.
 *
 * Why this matters: misconfigured environment variables, a broken server entry
 * point, or a firebase-admin initialisation failure will cause the server to
 * return empty or error HTML even though local `ng serve` looks fine.
 *
 * Implementation: We use Playwright's `request` fixture (Node.js fetch) to get
 * the raw HTTP response body rather than waiting for the browser to hydrate.
 */

import { test, expect } from '@playwright/test';

test.describe('SSR — Home page', () => {
  test('server response contains the FolioKit Blog h1 text', async ({ request }) => {
    const response = await request.get('/');
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain('FolioKit Blog');
  });

  test('server response contains Angular app root element', async ({ request }) => {
    const response = await request.get('/');
    const body = await response.text();
    // Angular SSR always renders the root component selector
    expect(body).toMatch(/<folio-root|<app-root/i);
  });
});

test.describe('SSR — Posts list page', () => {
  test('server response contains seeded post titles', async ({ request }) => {
    const response = await request.get('/posts');
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain('Hello World');
    expect(body).toContain('Angular Signals Deep Dive');
  });
});

test.describe('SSR — About page', () => {
  test('server response contains the about headline', async ({ request }) => {
    const response = await request.get('/about');
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    // Seeded headline
    expect(body).toContain("Hey, I'm Dev Author");
  });
});

test.describe('SSR — Links page', () => {
  test('server response contains seeded link labels', async ({ request }) => {
    const response = await request.get('/links');
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain('My Blog');
    expect(body).toContain('GitHub');
  });
});

test.describe('SSR — Hydration health', () => {
  test('home page has no Angular hydration mismatch errors in console', async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      // Angular logs NG0500 series errors for hydration mismatches.
      if (msg.type() === 'error' && /NG0[5-9]\d\d|hydration/i.test(text)) {
        hydrationErrors.push(text);
      }
    });

    await page.goto('/');
    // Allow time for hydration to complete
    await page.waitForTimeout(2_000);

    expect(hydrationErrors).toHaveLength(0);
  });

  test('about page has no Angular hydration mismatch errors in console', async ({ page }) => {
    const hydrationErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error' && /NG0[5-9]\d\d|hydration/i.test(text)) {
        hydrationErrors.push(text);
      }
    });

    await page.goto('/about');
    await page.waitForTimeout(2_000);

    expect(hydrationErrors).toHaveLength(0);
  });
});
