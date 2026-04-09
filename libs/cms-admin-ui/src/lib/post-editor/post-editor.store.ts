import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, filter, switchMap } from 'rxjs/operators';
import { BlogPost, PostService } from '@foliokit/cms-core';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface PostEditorState {
  post: BlogPost | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  mode: 'new' | 'edit';
  cursorPosition: number;
  tempPostId: string;
  saveStatus: SaveStatus;
  lastSavedAt: Date | null;
}

const initialState: PostEditorState = {
  post: null,
  isDirty: false,
  isSaving: false,
  saveError: null,
  mode: 'new',
  cursorPosition: 0,
  tempPostId: crypto.randomUUID(),
  saveStatus: 'idle',
  lastSavedAt: null,
};

function blankPost(): BlogPost {
  const now = Date.now();
  return {
    id: '',
    slug: '',
    title: '',
    subtitle: '',
    status: 'draft',
    content: '',
    excerpt: '',
    tags: [],
    embeddedMedia: {},
    seo: {},
    publishedAt: now,
    updatedAt: now,
    createdAt: now,
  };
}

export const PostEditorStore = signalStore(
  withState<PostEditorState>(initialState),

  withComputed((store) => ({
    isNew: computed(() => store.mode() === 'new'),
    canPublish: computed(() => {
      const post = store.post();
      return (
        post !== null &&
        post.title.trim().length > 0 &&
        post.status !== 'published'
      );
    }),
    saveStatusLabel: computed(() => {
      const status = store.saveStatus();
      const lastSaved = store.lastSavedAt();
      if (status === 'saving') return 'Saving…';
      if (status === 'saved' && lastSaved)
        return `Saved at ${lastSaved.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      if (status === 'error') return 'Save failed — retry?';
      return '';
    }),
  })),

  withMethods((store, postService = inject(PostService)) => {
    let autosaveTrigger$: Subject<'save' | 'cancel'> | null = null;

    function cancelAutosave() {
      autosaveTrigger$?.next('cancel');
    }

    return {
      _setAutosaveTrigger(trigger: Subject<'save' | 'cancel'>) {
        autosaveTrigger$ = trigger;
      },

      loadPost(id: string): void {
        postService.getPostById(id).subscribe((post) => {
          patchState(store, {
            post,
            isDirty: false,
            isSaving: false,
            saveError: null,
            mode: 'edit',
          });
        });
      },

      initNew(): void {
        patchState(store, {
          post: blankPost(),
          isDirty: false,
          isSaving: false,
          saveError: null,
          mode: 'new',
        });
      },

      setSaveStatus(status: SaveStatus): void {
        patchState(store, { saveStatus: status });
      },

      setLastSavedAt(date: Date): void {
        patchState(store, { lastSavedAt: date });
      },

      updateField<K extends keyof BlogPost>(field: K, value: BlogPost[K]): void {
        const current = store.post();
        if (!current) return;
        patchState(store, { post: { ...current, [field]: value }, isDirty: true, saveStatus: 'idle' });
      },

      save(): void {
        const post = store.post();
        if (!post) return;
        cancelAutosave();
        patchState(store, { isSaving: true, saveError: null });
        postService.savePost(post).subscribe({
          next: (saved) => {
            patchState(store, {
              post: saved,
              isDirty: false,
              isSaving: false,
              mode: 'edit',
            });
          },
          error: (err: unknown) => {
            const message =
              err instanceof Error ? err.message : 'Save failed';
            patchState(store, { isSaving: false, saveError: message });
          },
        });
      },

      setCursorPosition(position: number): void {
        patchState(store, { cursorPosition: position });
      },

      insertMediaAtCursor(token: string): void {
        const post = store.post();
        const pos = store.cursorPosition();
        if (!post) return;
        const before = post.content.slice(0, pos);
        const after = post.content.slice(pos);
        const insertion = `![alt](${token})`;
        patchState(store, {
          post: { ...post, content: `${before}${insertion}${after}` },
          isDirty: true,
          cursorPosition: pos + insertion.length,
        });
      },

      removeEmbeddedMedia(token: string): void {
        const post = store.post();
        if (!post) return;
        const entry = post.embeddedMedia[token];
        const { [token]: _, ...remaining } = post.embeddedMedia;
        patchState(store, {
          post: { ...post, embeddedMedia: remaining },
          isDirty: true,
        });
        if (entry) {
          postService.deleteStorageFile(entry.storagePath).subscribe();
        }
      },

      publish(): void {
        const post = store.post();
        if (!post) return;
        const prevStatus = post.status;
        const prevPublishedAt = post.publishedAt;
        const now = Date.now();
        patchState(store, {
          post: { ...post, status: 'published', publishedAt: now },
          isDirty: true,
        });
        cancelAutosave();
        patchState(store, { isSaving: true, saveError: null });
        postService.savePost({ ...post, status: 'published', publishedAt: now }).subscribe({
          next: (saved) => {
            patchState(store, {
              post: saved,
              isDirty: false,
              isSaving: false,
              mode: 'edit',
            });
          },
          error: (err: unknown) => {
            const message =
              err instanceof Error ? err.message : 'Publish failed';
            const current = store.post();
            patchState(store, {
              post: current
                ? { ...current, status: prevStatus, publishedAt: prevPublishedAt }
                : current,
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
            const post = store.post();
            if (!post || !store.isDirty() || post.status !== 'draft') {
              return [];
            }
            return [true];
          }),
        )
        .subscribe(() => store.save());

      // Note: watchState trigger removed — autosave is driven by the component
      // via saveSignal$ (1500 ms debounce) to avoid duplicate Firestore writes.

      return () => {
        autosaveSub.unsubscribe();
        trigger$.complete();
      };
    },
  }),
);
