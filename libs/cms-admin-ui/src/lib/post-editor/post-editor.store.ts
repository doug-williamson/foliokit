import { inject } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
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
import { BlogPost, PostService } from '@foliokit/cms-core';

export interface PostEditorState {
  post: BlogPost | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  mode: 'new' | 'edit';
}

const initialState: PostEditorState = {
  post: null,
  isDirty: false,
  isSaving: false,
  saveError: null,
  mode: 'new',
};

function blankPost(): BlogPost {
  const now = Timestamp.now();
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

      updateField<K extends keyof BlogPost>(field: K, value: BlogPost[K]): void {
        const current = store.post();
        if (!current) return;
        patchState(store, { post: { ...current, [field]: value }, isDirty: true });
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

      publish(): void {
        const post = store.post();
        if (!post) return;
        const now = Timestamp.now();
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
            patchState(store, { isSaving: false, saveError: message });
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

      watchState(store, (state) => {
        if (state.isDirty && state.post?.status === 'draft') {
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
