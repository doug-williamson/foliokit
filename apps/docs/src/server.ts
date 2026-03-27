import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const BASE_URL = 'https://foliokitcms.com';

const DOCS_ROUTES = [
  '',
  'docs/getting-started',
  'docs/getting-started/nx',
  'docs/app-shell',
  'docs/app-shell/api',
  'docs/app-shell/theming',
  'docs/app-shell/examples',
  'docs/links-page',
  'docs/links-page/api',
  'docs/links-page/examples',
  'docs/markdown',
  'docs/markdown/api',
  'docs/markdown/examples',
  'docs/theming',
  'docs/firebase',
  'docs/components/about-page',
  'docs/components/links-page',
  'docs/components/markdown',
  'docs/tokens',
  'docs/tokens/shell-config',
  'docs/tokens/seo-meta',
  'docs/tokens/embedded-media',
];

app.get('/sitemap.xml', (_req, res) => {
  const urls = DOCS_ROUTES.map(route => {
    const loc = route ? `${BASE_URL}/${route}` : `${BASE_URL}/`;
    const priority = route === '' ? '1.0' : route.includes('/') ? '0.7' : '0.8';
    return `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

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
