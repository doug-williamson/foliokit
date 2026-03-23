import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdminApp } from '../../../libs/cms-core/src/lib/firebase/firebase-admin';

initAdminApp();

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// ── Sitemap cache ────────────────────────────────────────────────────────────
const BASE_URL = 'https://blog.foliokitcms.com';
const SITEMAP_TTL_MS = 60 * 60 * 1000; // 1 hour

interface SitemapCache {
  xml: string;
  timestamp: number;
}

let sitemapCache: SitemapCache | null = null;

function buildStaticSitemap(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
}

app.get('/sitemap.xml', async (_req, res) => {
  const now = Date.now();

  if (sitemapCache && now - sitemapCache.timestamp < SITEMAP_TTL_MS) {
    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemapCache.xml);
    return;
  }

  let postEntries = '';

  try {
    const db = getFirestore();
    const snapshot = await db
      .collection('posts')
      .where('status', '==', 'published')
      .select('slug', 'updatedAt')
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data() as { slug?: string; updatedAt?: { toMillis?: () => number } | number };
      const slug = data['slug'];
      if (!slug) continue;

      const rawUpdatedAt = data['updatedAt'];
      let updatedAtMs: number;
      if (rawUpdatedAt && typeof rawUpdatedAt === 'object' && typeof rawUpdatedAt.toMillis === 'function') {
        updatedAtMs = rawUpdatedAt.toMillis();
      } else if (typeof rawUpdatedAt === 'number') {
        updatedAtMs = rawUpdatedAt;
      } else {
        updatedAtMs = Date.now();
      }

      const lastmod = new Date(updatedAtMs).toISOString().split('T')[0];
      postEntries += `  <url>
    <loc>${BASE_URL}/posts/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    }
  } catch (err) {
    console.error('[sitemap] Firestore query failed, returning static-only sitemap:', err);
    const xml = buildStaticSitemap();
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
    return;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
${postEntries}</urlset>`;

  sitemapCache = { xml, timestamp: now };
  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
