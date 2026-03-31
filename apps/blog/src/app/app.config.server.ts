import { mergeApplicationConfig, ApplicationConfig, REQUEST_CONTEXT, inject } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { AUTHOR_SERVICE, BLOG_POST_SERVICE, SITE_CONFIG_SERVICE, SITE_ID } from '@foliokit/cms-core';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { ServerAuthorService } from './services/server-author.service';
import { ServerBlogPostService } from './services/server-post.service';
import { ServerSiteConfigService } from './services/server-site-config.service';
import { BLOG_STATIC_SITE_ID } from './blog-app-tenant';

/**
 * Expected shape of the request context passed from the Express
 * middleware in server.ts via `angularApp.handle(req, context)`.
 */
interface FolioKitRequestContext {
  tenantId: string;
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: AUTHOR_SERVICE, useClass: ServerAuthorService },
    { provide: BLOG_POST_SERVICE, useClass: ServerBlogPostService },
    { provide: SITE_CONFIG_SERVICE, useClass: ServerSiteConfigService },

    // Override SITE_ID per request with the tenant resolved by the Express
    // middleware. This takes precedence over the static value provided by
    // providesFolioKit() in app.config.ts. Angular's last-provider-wins
    // rule applies after mergeApplicationConfig().
    {
      provide: SITE_ID,
      useFactory: () => {
        const ctx = inject(REQUEST_CONTEXT) as FolioKitRequestContext | null;
        const fromHost = ctx?.tenantId ?? 'default';
        // Hostname resolution returns `default` for localhost / unknown hosts; the SPA still
        // uses BLOG_STATIC_SITE_ID from providesFolioKit — align SSR or TransferState is empty.
        return fromHost === 'default' ? BLOG_STATIC_SITE_ID : fromHost;
      },
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
