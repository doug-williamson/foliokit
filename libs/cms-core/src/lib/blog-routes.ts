import { inject, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { CanActivateFn, ResolveFn, Routes } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { SeriesService } from './services/series.service';
import type { Series } from './models/series.model';

import { featureGuard } from './guards/feature.guard';
import { createPostDetailResolver } from './resolvers/post-detail.resolver';
import { createPostsResolver } from './resolvers/posts.resolver';
import { createAboutPageResolver } from './resolvers/about-page.resolver';
import { createHomeSiteConfigResolver } from './resolvers/home-site-config.resolver';
import { createLinksPageResolver } from './resolvers/links-page.resolver';
import { SITE_CONFIG } from './tokens/site-config.token';

/**
 * Simplified about-page guard that reads the eagerly-loaded {@link SITE_CONFIG}
 * value token instead of going through the observable-based service.
 *
 * Falls back to `true` (enabled) when `SITE_CONFIG` is not provided.
 */
export const aboutPageEnabledGuard: CanActivateFn = () => {
  const config = inject(SITE_CONFIG, { optional: true });
  return config?.pages?.about?.enabled ?? true;
};

/**
 * Simplified links-page guard that reads the eagerly-loaded {@link SITE_CONFIG}
 * value token instead of going through the observable-based service.
 *
 * Falls back to `true` (enabled) when `SITE_CONFIG` is not provided.
 */
export const linksPageEnabledGuard: CanActivateFn = () => {
  const config = inject(SITE_CONFIG, { optional: true });
  return config?.pages?.links?.enabled ?? true;
};

// Helper that wraps a dynamic import of @foliokit/cms-ui. The module path is
// kept as a string literal so Angular's build tooling can still discover the
// lazy chunk boundary. The `@ts-expect-error` suppresses TS2307 during the
// *library* build (ng-packagr) because @foliokit/cms-ui is a peer resolved
// at *application* build time, not during library compilation.
function loadUi(): Promise</* @foliokit/cms-ui */ Record<string, unknown>> {
  // @ts-ignore TS2307 — @foliokit/cms-ui is a peer, resolved at app build time
  return import('@foliokit/cms-ui');
}

// ── Private taxonomy resolver factories ──────────────────────────────────────
// These mirror the exported factories in @foliokit/cms-ui but live here to
// avoid a circular dependency (cms-ui → cms-core). TransferState keys match
// so hydration is compatible if consumers switch between the two route sets.

const SERIES_ALL_KEY = makeStateKey<Series[]>('series-all');

function createSeriesAllResolver(): ResolveFn<Series[]> {
  return () => {
    const transferState = inject(TransferState);
    const platformId = inject(PLATFORM_ID);
    if (transferState.hasKey(SERIES_ALL_KEY)) {
      const series = transferState.get(SERIES_ALL_KEY, []);
      transferState.remove(SERIES_ALL_KEY);
      return series;
    }
    if (!isPlatformBrowser(platformId)) return [];
    return inject(SeriesService).getAll().pipe(take(1));
  };
}

function createSeriesDetailResolver(): ResolveFn<Series | null> {
  return (route) => {
    const slug = route.paramMap.get('slug') ?? '';
    const transferState = inject(TransferState);
    const platformId = inject(PLATFORM_ID);
    const stateKey = makeStateKey<Series | null>(`series-detail:${slug}`);
    if (transferState.hasKey(stateKey)) {
      const series = transferState.get(stateKey, null);
      transferState.remove(stateKey);
      return series;
    }
    if (!isPlatformBrowser(platformId)) return null;
    return inject(SeriesService).getAll().pipe(
      take(1),
      map((list) => list.find((s) => s.slug === slug) ?? null),
    );
  };
}

/**
 * Standard blog route tree backed by `@foliokit/cms-ui` components.
 *
 * Includes home, post-list, post-detail (without resolver), about, links,
 * not-found, and wildcard routes. Consumers who need a custom post-detail
 * resolver should override the `posts/:slug` route after spreading:
 *
 * ```ts
 * export const appRoutes: Route[] = [
 *   ...FOLIO_BLOG_ROUTES.filter(r => r.path !== 'posts/:slug'),
 *   {
 *     path: 'posts/:slug',
 *     loadComponent: () =>
 *       import('@foliokit/cms-ui').then(m => m.BlogPostDetailComponent),
 *     resolve: { post: myCustomResolver },
 *   },
 * ];
 * ```
 */
export const FOLIO_BLOG_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    resolve: { homeSiteConfig: createHomeSiteConfigResolver() },
    loadComponent: () => loadUi().then((m) => m['BlogHomeComponent'] as any),
  },
  {
    path: 'posts',
    loadComponent: () =>
      loadUi().then((m) => m['BlogPostListComponent'] as any),
    resolve: { posts: createPostsResolver() },
  },
  {
    path: 'posts/:slug',
    loadComponent: () =>
      loadUi().then((m) => m['BlogPostDetailComponent'] as any),
    resolve: { post: createPostDetailResolver() },
  },
  {
    path: 'about',
    canActivate: [featureGuard('about')],
    resolve: { about: createAboutPageResolver() },
    loadComponent: () =>
      loadUi().then((m) => m['BlogAboutPageComponent'] as any),
  },
  {
    path: 'links',
    title: 'Links | FolioKit',
    canActivate: [featureGuard('links')],
    resolve: { page: createLinksPageResolver() },
    loadComponent: () => loadUi().then((m) => m['LinksPageComponent'] as any),
  },
  {
    path: 'series',
    loadComponent: () => loadUi().then((m) => m['SeriesListComponent'] as any),
    resolve: { series: createSeriesAllResolver() },
  },
  {
    path: 'series/:slug',
    loadComponent: () => loadUi().then((m) => m['SeriesDetailComponent'] as any),
    resolve: { series: createSeriesDetailResolver() },
  },
  {
    path: 'not-found',
    loadComponent: () => loadUi().then((m) => m['NotFoundComponent'] as any),
  },
  {
    path: '**',
    loadComponent: () => loadUi().then((m) => m['NotFoundComponent'] as any),
  },
];
