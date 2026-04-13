import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { AboutPageConfig, HomePageConfig, LinksPageConfig, SiteConfig } from '@foliokit/cms-core';
import { SiteConfigService } from '@foliokit/cms-core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { EMPTY, type Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';

export type EnablePageKey = 'home' | 'blog' | 'about' | 'links';

export interface SiteConfigNavState {
  config: SiteConfig | null;
  isSaving: boolean;
  saveError: string | null;
}

const initialState: SiteConfigNavState = {
  config: null,
  isSaving: false,
  saveError: null,
};

function mergeEnabledPage(current: SiteConfig, page: EnablePageKey): SiteConfig {
  const pages = { ...current.pages };
  switch (page) {
    case 'home':
      pages.home = {
        ...(pages.home ?? { heroHeadline: '', enabled: true }),
        enabled: true,
      } as HomePageConfig;
      return {
        ...current,
        pages,
        adminNavShortcuts: {
          ...current.adminNavShortcuts,
          home: true,
        },
      };
    case 'blog':
      pages.blog = { enabled: true };
      break;
    case 'about':
      pages.about = {
        ...(pages.about ?? { headline: '', bio: '', enabled: false }),
        enabled: true,
      } as AboutPageConfig;
      break;
    case 'links':
      pages.links = {
        ...(pages.links ?? { enabled: false, links: [] }),
        enabled: true,
      } as LinksPageConfig;
      break;
  }
  return { ...current, pages };
}

/**
 * Live site config for admin shell nav + enable-page bottom sheet.
 * Provided on {@link AdminShellComponent} only (not route-scoped editor store).
 */
export const SiteConfigNavStore = signalStore(
  withState(initialState),

  withMethods((store, siteConfigService = inject(SiteConfigService), destroyRef = inject(DestroyRef)) => {
    siteConfigService
      .watchDefaultSiteConfig()
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((config) => {
        patchState(store, { config, saveError: null });
      });

    return {
      /**
       * Persists `pages[page].enabled` (merge). Emits once on success or error (HTTP).
       * Used by {@link EnablePageSheetComponent} to dismiss when save completes.
       */
      enablePage(page: EnablePageKey): Observable<void> {
        const current = store.config();
        if (!current) return EMPTY;
        const updated = mergeEnabledPage(current, page);
        patchState(store, { isSaving: true, saveError: null });
        return siteConfigService.saveSiteConfig(updated).pipe(
          tap({
            next: (saved) =>
              patchState(store, {
                config: saved,
                isSaving: false,
                saveError: null,
              }),
            error: (err: unknown) =>
              patchState(store, {
                isSaving: false,
                saveError: err instanceof Error ? err.message : 'Save failed',
              }),
          }),
          map(() => void 0),
        );
      },
    };
  }),
);
