import { inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { computed } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, tap } from 'rxjs';
import { BlogPost, PostService } from '@foliokit/cms-core';

export interface PostEditorState {
  post: BlogPost | null;
  /** Last persisted server state; used for discard and route-leave reset. */
  persistedPost: BlogPost | null;
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  mode: 'new' | 'edit';
  cursorPosition: number;
  tempPostId: string;
}

const initialState: PostEditorState = {
  post: null,
  persistedPost: null,
  isDirty: false,
  isSaving: false,
  saveError: null,
  mode: 'new',
  cursorPosition: 0,
  tempPostId: crypto.randomUUID(),
};

function clonePost(post: BlogPost): BlogPost {
  return structuredClone(post);
}

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
  })),

  withMethods((store, postService = inject(PostService), router = inject(Router)) => {
    const discardChanges = (): void => {
      const base = store.persistedPost();
      if (!base) return;
      patchState(store, {
        post: clonePost(base),
        isDirty: false,
        saveError: null,
      });
    };

    return {
      loadPost(id: string): void {
        postService.getPostById(id).subscribe((post) => {
          const coerced =
            post.status === 'scheduled'
              ? { ...post, status: 'draft' as const, scheduledPublishAt: undefined }
              : post;
          patchState(store, {
            post: coerced,
            persistedPost: clonePost(coerced),
            isDirty: false,
            isSaving: false,
            saveError: null,
            mode: 'edit',
          });
        });
      },

      initNew(): void {
        const p = blankPost();
        patchState(store, {
          post: p,
          persistedPost: clonePost(p),
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

      save(): Observable<BlogPost> {
        const post = store.post();
        if (!post) return EMPTY as Observable<BlogPost>;
        patchState(store, { isSaving: true, saveError: null });
        return postService.savePost(post).pipe(
          tap({
            next: (saved) => {
              patchState(store, {
                post: saved,
                persistedPost: clonePost(saved),
                isDirty: false,
                isSaving: false,
                saveError: null,
                mode: 'edit',
              });
            },
            error: (err: unknown) => {
              const message =
                err instanceof Error ? err.message : 'Save failed';
              patchState(store, { isSaving: false, saveError: message });
            },
          }),
        );
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

      unpublish(): Observable<BlogPost> {
        const post = store.post();
        if (!post) return EMPTY as Observable<BlogPost>;
        const prevStatus = post.status;
        const prevPublishedAt = post.publishedAt;
        patchState(store, {
          post: { ...post, status: 'draft', publishedAt: 0 },
          isDirty: true,
        });
        patchState(store, { isSaving: true, saveError: null });
        return postService.savePost({ ...post, status: 'draft', publishedAt: 0 }).pipe(
          tap({
            next: (saved) => {
              patchState(store, {
                post: saved,
                persistedPost: clonePost(saved),
                isDirty: false,
                isSaving: false,
                saveError: null,
                mode: 'edit',
              });
            },
            error: (err: unknown) => {
              const message =
                err instanceof Error ? err.message : 'Unpublish failed';
              const current = store.post();
              patchState(store, {
                post: current
                  ? { ...current, status: prevStatus, publishedAt: prevPublishedAt }
                  : current,
                isSaving: false,
                saveError: message,
              });
            },
          }),
        );
      },

      deletePost(): Observable<void> {
        const post = store.post();
        if (!post?.id) return EMPTY as Observable<void>;
        patchState(store, { isSaving: true, saveError: null });
        return postService.deletePost(post.id).pipe(
          tap({
            next: () => {
              patchState(store, { isDirty: false, isSaving: false, saveError: null });
              router.navigate(['/posts']);
            },
            error: (err: unknown) => {
              const message = err instanceof Error ? err.message : 'Delete failed';
              patchState(store, { isSaving: false, saveError: message });
            },
          }),
        );
      },

      publish(): Observable<BlogPost> {
        const post = store.post();
        if (!post) return EMPTY as Observable<BlogPost>;
        const prevStatus = post.status;
        const prevPublishedAt = post.publishedAt;
        const now = Date.now();
        patchState(store, {
          post: { ...post, status: 'published', publishedAt: now },
          isDirty: true,
        });
        patchState(store, { isSaving: true, saveError: null });
        return postService.savePost({ ...post, status: 'published', publishedAt: now }).pipe(
          tap({
            next: (saved) => {
              patchState(store, {
                post: saved,
                persistedPost: clonePost(saved),
                isDirty: false,
                isSaving: false,
                saveError: null,
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
          }),
        );
      },

      discardChanges,
      discard: discardChanges,
    };
  }),
);
