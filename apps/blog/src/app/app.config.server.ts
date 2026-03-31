import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { AUTHOR_SERVICE, BLOG_POST_SERVICE, SITE_CONFIG_SERVICE, SITE_ID } from '@foliokit/cms-core';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { ServerAuthorService } from './services/server-author.service';
import { ServerBlogPostService } from './services/server-post.service';
import { ServerSiteConfigService } from './services/server-site-config.service';
import { BLOG_STATIC_SITE_ID } from './blog-app-tenant';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: AUTHOR_SERVICE, useClass: ServerAuthorService },
    { provide: BLOG_POST_SERVICE, useClass: ServerBlogPostService },
    { provide: SITE_CONFIG_SERVICE, useClass: ServerSiteConfigService },

    // This blog app bundle is wired to a single tenant via providesFolioKit({ tenantId }).
    // Hostname-based resolution returns the Firestore *document id* for a tenant, which is
    // often not the same string as BLOG_STATIC_SITE_ID — using it here pointed SSR at the
    // wrong collection while the browser read tenants/<BLOG_STATIC_SITE_ID>/posts.
    { provide: SITE_ID, useValue: BLOG_STATIC_SITE_ID },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
