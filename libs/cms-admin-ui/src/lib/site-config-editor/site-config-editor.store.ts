import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  AboutPageConfig,
  BlogPageConfig,
  HomePageConfig,
  LinksPageConfig,
  SITE_ID,
  SiteConfig,
  SiteConfigService,
} from '@foliokit/cms-core';

export interface SiteConfigEditorState {
  config: SiteConfig | null;
  savedConfig: SiteConfig | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
}

function createEmptyConfig(tenantId: string): SiteConfig {
  return {
    id: tenantId,
    siteName: '',
    siteUrl: '',
    pages: {
      home: { enabled: false, heroHeadline: '', ctaLabel: 'Read Posts', ctaUrl: '/posts' },
      // about and links intentionally omitted — absence signals "not enabled"
    },
    updatedAt: 0,
  };
}

const initialState: SiteConfigEditorState = {
  config: null,
  savedConfig: null,
  isDirty: false,
  isSaving: false,
  saveError: null,
};

export const SiteConfigEditorStore = signalStore(
  withState<SiteConfigEditorState>(initialState),

  withMethods((store, siteConfigService = inject(SiteConfigService), tenantId = inject(SITE_ID, { optional: true }) ?? 'default') => {
    let loadInProgress = false;
    return {
      load(): void {
        if (store.config() !== null || loadInProgress) return;
        loadInProgress = true;
        siteConfigService.getDefaultSiteConfig().subscribe({
          next: (config) => {
            const loaded = config ?? createEmptyConfig(tenantId);
            patchState(store, {
              config: loaded,
              savedConfig: loaded,
              isDirty: false,
              isSaving: false,
              saveError: null,
            });
            loadInProgress = false;
          },
          error: () => {
            loadInProgress = false;
          },
        });
      },

      updateField<K extends keyof SiteConfig>(field: K, value: SiteConfig[K]): void {
        const current = store.config();
        if (!current) return;
        patchState(store, { config: { ...current, [field]: value }, isDirty: true });
      },

      updateHome(home: Omit<HomePageConfig, 'enabled'>): void {
        const current = store.config();
        if (!current) return;
        const enabled = current.pages?.home?.enabled ?? false;
        patchState(store, {
          config: {
            ...current,
            pages: { ...current.pages, home: { ...home, enabled } },
          },
          isDirty: true,
        });
      },

      /** Replace the full home page config (including `enabled`). */
      setHomePage(home: HomePageConfig): void {
        const current = store.config();
        if (!current) return;
        patchState(store, {
          config: {
            ...current,
            pages: { ...current.pages, home },
          },
          isDirty: true,
        });
      },

      /** Replace the full blog page config (including `enabled`). */
      setBlogPage(blog: BlogPageConfig): void {
        const current = store.config();
        if (!current) return;
        patchState(store, {
          config: {
            ...current,
            pages: { ...current.pages, blog },
          },
          isDirty: true,
        });
      },

      updateAbout(about: Omit<AboutPageConfig, 'enabled'>): void {
        const current = store.config();
        if (!current) return;
        const enabled = current.pages?.about?.enabled ?? false;
        patchState(store, {
          config: {
            ...current,
            pages: { ...current.pages, about: { ...about, enabled } },
          },
          isDirty: true,
        });
      },

      updateLinks(links: Omit<LinksPageConfig, 'enabled'>): void {
        const current = store.config();
        if (!current) return;
        const enabled = current.pages?.links?.enabled ?? false;
        patchState(store, {
          config: {
            ...current,
            pages: { ...current.pages, links: { ...links, enabled } },
          },
          isDirty: true,
        });
      },

      save(): void {
        const config = store.config();
        if (!config) return;
        patchState(store, { isSaving: true, saveError: null });
        siteConfigService.saveSiteConfig(config).subscribe({
          next: (saved) => {
            patchState(store, {
              config: saved,
              savedConfig: saved,
              isDirty: false,
              isSaving: false,
              saveError: null,
            });
          },
          error: (err: unknown) => {
            const message = err instanceof Error ? err.message : 'Save failed';
            patchState(store, { isSaving: false, saveError: message });
          },
        });
      },

      togglePageEnabled(page: 'home' | 'about' | 'links' | 'blog', value: boolean): void {
        const current = store.config();
        if (!current) return;
        const pagePatch =
          page === 'blog'
            ? { blog: { ...current.pages?.blog, enabled: value } }
            : { [page]: { ...current.pages?.[page], enabled: value } };
        const updated: SiteConfig = {
          ...current,
          pages: {
            ...current.pages,
            ...pagePatch,
          },
        };
        patchState(store, { config: updated, isSaving: true, saveError: null });
        siteConfigService.saveSiteConfig(updated).subscribe({
          next: (saved) =>
            patchState(store, {
              config: saved,
              savedConfig: saved,
              isDirty: false,
              isSaving: false,
              saveError: null,
            }),
          error: (err: unknown) =>
            patchState(store, {
              config: current,
              isSaving: false,
              saveError: err instanceof Error ? err.message : 'Save failed',
            }),
        });
      },

      discard(): void {
        const saved = store.savedConfig();
        if (!saved) return;
        patchState(store, { config: { ...saved }, isDirty: false, saveError: null });
      },
    };
  }),
);
