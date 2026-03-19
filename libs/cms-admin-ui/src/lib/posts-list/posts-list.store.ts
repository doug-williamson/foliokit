import { computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { BlogPost, PostService } from '@foliokit/cms-core';

export interface PostsListState {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
}

const initialState: PostsListState = {
  posts: [],
  loading: false,
  error: null,
};

export const PostsListStore = signalStore(
  withState<PostsListState>(initialState),

  withComputed((store) => ({
    draftPosts: computed(() =>
      store.posts().filter((p) => p.status === 'draft'),
    ),
    scheduledPosts: computed(() =>
      store.posts().filter((p) => p.status === 'scheduled'),
    ),
    publishedPosts: computed(() =>
      store.posts().filter((p) => p.status === 'published'),
    ),
    archivedPosts: computed(() =>
      store.posts().filter((p) => p.status === 'archived'),
    ),
    // Kept for backward compatibility
    draftCount: computed(
      () => store.posts().filter((p) => p.status === 'draft').length,
    ),
    scheduledCount: computed(
      () => store.posts().filter((p) => p.status === 'scheduled').length,
    ),
    publishedCount: computed(
      () => store.posts().filter((p) => p.status === 'published').length,
    ),
  })),

  withMethods(
    (store, postService = inject(PostService), platformId = inject(PLATFORM_ID)) => ({
      loadPosts(): void {
        if (!isPlatformBrowser(platformId)) return;
        patchState(store, { loading: true, error: null });
        postService.getAllPosts().subscribe({
          next: (posts) => {
            patchState(store, { posts, loading: false });
          },
          error: (err: unknown) => {
            const message =
              err instanceof Error ? err.message : 'Failed to load posts';
            patchState(store, { loading: false, error: message });
          },
        });
      },

      reorderQueue(previousIndex: number, currentIndex: number): void {
        const reordered = [...store.scheduledPosts()];
        moveItemInArray(reordered, previousIndex, currentIndex);
        const nonScheduled = store.posts().filter((p) => p.status !== 'scheduled');
        patchState(store, { posts: [...nonScheduled, ...reordered] });
        // TODO: persist queueOrder to Firestore when ready
      },
    }),
  ),
);
