import { InjectionToken } from '@angular/core';
import { DocsRouteNode } from '../models/docs-route-node.model';
import { DocsPageMeta } from '../models/docs-page-meta.model';

export const DOCS_ROUTE_MANIFEST = new InjectionToken<DocsRouteNode[]>(
  'DOCS_ROUTE_MANIFEST'
);

export const DOCS_PAGE_META = new InjectionToken<DocsPageMeta>(
  'DOCS_PAGE_META'
);
