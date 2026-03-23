import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withMethods,
  withState,
} from '@ngrx/signals';
import { AboutPageConfig, NavItem, SiteConfig, SiteConfigService } from '@foliokit/cms-core';

export interface SiteConfigEditorState {
  config: SiteConfig | null;
  savedConfig: SiteConfig | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
}

const emptyConfig: SiteConfig = {
  id: 'default',
  siteName: '',
  siteUrl: '',
  nav: [],
  pages: undefined,
  updatedAt: 0,
};

const initialState: SiteConfigEditorState = {
  config: null,
  savedConfig: null,
  isDirty: false,
  isSaving: false,
  saveError: null,
};

export const SiteConfigEditorStore = signalStore(
  withState<SiteConfigEditorState>(initialState),

  withMethods((store, siteConfigService = inject(SiteConfigService)) => ({
    load(): void {
      siteConfigService.getDefaultSiteConfig().subscribe((config) => {
        const loaded = config ?? { ...emptyConfig };
        patchState(store, {
          config: loaded,
          savedConfig: loaded,
          isDirty: false,
          isSaving: false,
          saveError: null,
        });
      });
    },

    updateField<K extends keyof SiteConfig>(field: K, value: SiteConfig[K]): void {
      const current = store.config();
      if (!current) return;
      patchState(store, { config: { ...current, [field]: value }, isDirty: true });
    },

    updateNav(items: NavItem[]): void {
      const current = store.config();
      if (!current) return;
      patchState(store, { config: { ...current, nav: items }, isDirty: true });
    },

    updateAbout(about: AboutPageConfig): void {
      const current = store.config();
      if (!current) return;
      patchState(store, {
        config: { ...current, pages: { ...current.pages, about } },
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
          });
        },
        error: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Save failed';
          patchState(store, { isSaving: false, saveError: message });
        },
      });
    },

    discard(): void {
      const saved = store.savedConfig();
      if (!saved) return;
      patchState(store, { config: { ...saved }, isDirty: false, saveError: null });
    },
  })),
);
