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
import { resolveTenantFromHostname } from '../../../libs/cms-core/src/lib/firebase/tenant-resolver';
import { resolveCollectionPath } from '@foliokit/cms-core';
import { BLOG_STATIC_SITE_ID } from './app/blog-app-tenant';

initAdminApp();

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// ── Tenant resolution middleware ────────────────────────────────────────────
// Resolves the hostname to a tenant document id (for logging / future use).
// Firestore paths for this binary use BLOG_STATIC_SITE_ID so SSR matches providesFolioKit().

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

const DEV_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const DEV_TENANT_ID = 'foliokitcms';

app.use(async (req, res, next) => {
  const hostname = (req.hostname || req.headers.host || 'localhost')
    .toLowerCase()
    .replace(/:\d+$/, '');

  // Dev bypass — skip Firestore, use a hardcoded dev tenant.
  if (DEV_HOSTNAMES.has(hostname)) {
    req.tenantId = DEV_TENANT_ID;
    return next();
  }

  // Resolve tenant via Firestore (may throw on infra failure).
  try {
    const tenantId = await resolveTenantFromHostname(hostname);
    if (!tenantId) {
      res.status(404).send('Unknown tenant');
      return;
    }
    req.tenantId = tenantId;
    res.setHeader('X-Tenant-Id', tenantId);
    return next();
  } catch (err) {
    console.error('[server] Tenant resolution failed:', err);
    res.status(503).send('Service temporarily unavailable');
  }
});

// ── Sitemap cache ────────────────────────────────────────────────────────────
const SITEMAP_TTL_MS = 60 * 60 * 1000; // 1 hour

interface SitemapCache {
  xml: string;
  timestamp: number;
}

// Per-tenant sitemap cache.
const sitemapCaches = new Map<string, SitemapCache>();

function buildBaseUrl(req: express.Request): string {
  const proto = req.protocol;
  const host = req.get('host') || req.hostname;
  return `${proto}://${host}`;
}

function buildStaticSitemap(baseUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;
}

app.get('/sitemap.xml', async (req, res) => {
  const tenantId = BLOG_STATIC_SITE_ID;
  const now = Date.now();
  const baseUrl = buildBaseUrl(req);

  const cached = sitemapCaches.get(tenantId);
  if (cached && now - cached.timestamp < SITEMAP_TTL_MS) {
    res.setHeader('Content-Type', 'application/xml');
    res.send(cached.xml);
    return;
  }

  let postEntries = '';

  try {
    const db = getFirestore();
    const collectionPath = resolveCollectionPath('posts', tenantId);
    const snapshot = await db
      .collection(collectionPath)
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
    <loc>${baseUrl}/posts/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
    }
  } catch (err) {
    console.error('[sitemap] Firestore query failed, returning static-only sitemap:', err);
    const xml = buildStaticSitemap(baseUrl);
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
    return;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
${postEntries}</urlset>`;

  sitemapCaches.set(tenantId, { xml, timestamp: now });
  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

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
 * Request context tenant matches SITE_ID / providesFolioKit tenant for this deploy.
 */
app.use('/**', (req, res, next) => {
  angularApp
    .handle(req, { tenantId: BLOG_STATIC_SITE_ID })
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
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
