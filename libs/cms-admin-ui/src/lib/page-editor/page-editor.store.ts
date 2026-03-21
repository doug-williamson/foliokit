import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  watchState,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, filter, switchMap } from 'rxjs/operators';
import { PageService } from '@foliokit/cms-core';
import type { AboutPage, CmsPageUnion, LinksPage } from '@foliokit/cms-core';

export interface PageEditorState {
  page: CmsPageUnion | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  mode: 'new' | 'edit';
  cursorPosition: number;
  tempPageId: string;
}

const initialState: PageEditorState = {
  page: null,
  isDirty: false,
  isSaving: false,
  saveError: null,
  mode: 'new',
  cursorPosition: 0,
  tempPageId: crypto.randomUUID(),
};

function blankAboutPage(): AboutPage {
  const now = Date.now();
  return {
    id: '',
    type: 'about',
    slug: '',
    title: '',
    status: 'draft',
    body: '',
    contentVersion: 1,
    embeddedMedia: {},
    seo: {},
    updatedAt: now,
    createdAt: now,
  };
}

function blankLinksPage(): LinksPage {
  const now = Date.now();
  return {
    id: '',
    type: 'links',
    slug: '',
    title: '',
    status: 'draft',
    links: [],
    seo: {},
    updatedAt: now,
    createdAt: now,
  };
}

export const PageEditorStore = signalStore(
  withState<PageEditorState>(initialState),

  withComputed((store) => ({
    isNew: computed(() => store.mode() === 'new'),
    canPublish: computed(() => {
      const page = store.page();
      return (
        page !== null &&
        page.title.trim().length > 0 &&
        page.status !== 'published'
      );
    }),
  })),

  withMethods((store, pageService = inject(PageService)) => {
    let autosaveTrigger$: Subject<'save' | 'cancel'> | null = null;

    function cancelAutosave() {
      autosaveTrigger$?.next('cancel');
    }

    return {
      _setAutosaveTrigger(trigger: Subject<'save' | 'cancel'>) {
        autosaveTrigger$ = trigger;
      },

      loadPage(id: string): void {
        pageService.getPageById(id).subscribe((page) => {
          patchState(store, {
            page,
            isDirty: false,
            isSaving: false,
            saveError: null,
            mode: 'edit',
          });
        });
      },

      initNew(type: CmsPageUnion['type'] = 'about'): void {
        const page = type === 'links' ? blankLinksPage() : blankAboutPage();
        patchState(store, {
          page,
          isDirty: false,
          isSaving: false,
          saveError: null,
          mode: 'new',
        });
      },

      updateField(field: string, value: unknown): void {
        const current = store.page();
        if (!current) return;
        patchState(store, { page: { ...current, [field]: value } as CmsPageUnion, isDirty: true });
      },

      setCursorPosition(position: number): void {
        patchState(store, { cursorPosition: position });
      },

      insertMediaAtCursor(token: string): void {
        const page = store.page();
        const pos = store.cursorPosition();
        if (!page || page.type !== 'about') return;
        const before = page.body.slice(0, pos);
        const after = page.body.slice(pos);
        const insertion = `![alt](${token})`;
        patchState(store, {
          page: { ...page, body: `${before}${insertion}${after}` } as CmsPageUnion,
          isDirty: true,
          cursorPosition: pos + insertion.length,
        });
      },

      removeEmbeddedMedia(token: string): void {
        const page = store.page();
        if (!page || page.type !== 'about') return;
        const entry = page.embeddedMedia[token];
        const { [token]: _, ...remaining } = page.embeddedMedia;
        patchState(store, {
          page: { ...page, embeddedMedia: remaining } as CmsPageUnion,
          isDirty: true,
        });
        if (entry) {
          pageService.deleteStorageFile(entry.storagePath).subscribe();
        }
      },

      save(): void {
        const page = store.page();
        if (!page) return;
        cancelAutosave();
        patchState(store, { isSaving: true, saveError: null });
        pageService.savePage(page).subscribe({
          next: (saved) => {
            patchState(store, {
              page: saved,
              isDirty: false,
              isSaving: false,
              mode: 'edit',
            });
          },
          error: (err: unknown) => {
            const message = err instanceof Error ? err.message : 'Save failed';
            patchState(store, { isSaving: false, saveError: message });
          },
        });
      },

      toggleStatus(): void {
        const page = store.page();
        if (!page) return;
        const prevStatus = page.status;
        const newStatus: CmsPageUnion['status'] =
          prevStatus === 'published' ? 'draft' : 'published';
        patchState(store, {
          page: { ...page, status: newStatus } as CmsPageUnion,
          isDirty: true,
        });
        cancelAutosave();
        patchState(store, { isSaving: true, saveError: null });
        pageService.savePage({ ...page, status: newStatus }).subscribe({
          next: (saved) => {
            patchState(store, {
              page: saved,
              isDirty: false,
              isSaving: false,
              mode: 'edit',
            });
          },
          error: (err: unknown) => {
            const message = err instanceof Error ? err.message : 'Status change failed';
            patchState(store, {
              page: { ...page, status: prevStatus } as CmsPageUnion,
              isSaving: false,
              saveError: message,
            });
          },
        });
      },
    };
  }),

  withHooks({
    onInit(store) {
      const trigger$ = new Subject<'save' | 'cancel'>();
      store._setAutosaveTrigger(trigger$);

      const autosaveSub = trigger$
        .pipe(
          filter((v) => v === 'save'),
          debounceTime(2000),
          switchMap(() => {
            const page = store.page();
            if (!page || !store.isDirty() || page.status !== 'draft') {
              return [];
            }
            return [true];
          }),
        )
        .subscribe(() => store.save());

      watchState(store, (state) => {
        if (state.isDirty && state.page?.status === 'draft' && !state.isSaving) {
          trigger$.next('save');
        }
      });

      return () => {
        autosaveSub.unsubscribe();
        trigger$.complete();
      };
    },
  }),
);
