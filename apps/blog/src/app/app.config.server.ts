import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { BLOG_POST_SERVICE } from '@foliokit/cms-core';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { ServerBlogPostService } from './services/server-post.service';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: BLOG_POST_SERVICE, useClass: ServerBlogPostService },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
