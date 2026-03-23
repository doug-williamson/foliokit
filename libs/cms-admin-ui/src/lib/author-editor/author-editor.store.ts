import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { Author, AuthorService } from '@foliokit/cms-core';

export interface AuthorEditorState {
  author: Author | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  mode: 'new' | 'edit';
}

const initialState: AuthorEditorState = {
  author: null,
  isDirty: false,
  isSaving: false,
  saveError: null,
  mode: 'new',
};

function blankAuthor(): Author {
  const now = Date.now();
  return {
    id: '',
    displayName: '',
    bio: undefined,
    photoUrl: undefined,
    socialLinks: [],
    email: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export const AuthorEditorStore = signalStore(
  withState<AuthorEditorState>(initialState),

  withComputed((store) => ({
    isNew: computed(() => store.mode() === 'new'),
  })),

  withMethods((store, authorService = inject(AuthorService)) => ({
    loadAuthor(id: string): void {
      authorService.getById(id).subscribe((author) => {
        patchState(store, {
          author,
          isDirty: false,
          isSaving: false,
          saveError: null,
          mode: 'edit',
        });
      });
    },

    initNew(): void {
      patchState(store, {
        author: blankAuthor(),
        isDirty: false,
        isSaving: false,
        saveError: null,
        mode: 'new',
      });
    },

    updateField<K extends keyof Author>(field: K, value: Author[K]): void {
      const current = store.author();
      if (!current) return;
      patchState(store, { author: { ...current, [field]: value }, isDirty: true });
    },

    save(navigateFn?: () => void): void {
      const author = store.author();
      if (!author) return;
      patchState(store, { isSaving: true, saveError: null });

      const afterSave = (saved: Author) => {
        patchState(store, {
          author: saved,
          isDirty: false,
          isSaving: false,
          mode: 'edit',
        });
        navigateFn?.();
      };

      const onError = (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Save failed';
        patchState(store, { isSaving: false, saveError: message });
      };

      if (store.mode() === 'new') {
        const { id: _id, createdAt: _c, updatedAt: _u, ...data } = author;
        authorService.create(data).subscribe({ next: afterSave, error: onError });
      } else {
        const { id, createdAt: _c, ...data } = author;
        authorService.update(id, data).subscribe({
          next: () => afterSave({ ...author, updatedAt: Date.now() }),
          error: onError,
        });
      }
    },
  })),
);
