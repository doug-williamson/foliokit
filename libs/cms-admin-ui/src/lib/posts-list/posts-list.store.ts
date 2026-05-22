import { computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { BlogPost, PostService, SeriesService } from '@foliokit/cms-core';

export type PostStatus = BlogPost['status'];
export type PostFilterStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type PostsSortColumn = 'updatedAt' | 'viewCount';
export type PostsSortDirection = 'asc' | 'desc';

export interface PostsListState {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
  filterText: string;
  filterStatus: PostFilterStatus | 'all';
  sortBy: PostsSortColumn;
  sortDirection: PostsSortDirection;
}

const initialState: PostsListState = {
  posts: [],
  loading: false,
  error: null,
  filterText: '',
  filterStatus: 'all',
  sortBy: 'updatedAt',
  sortDirection: 'desc',
};

export const PostsListStore = signalStore(
  withState<PostsListState>(initialState),

  withComputed((store) => ({
    draftPosts: computed(() =>
      store.posts().filter((p) => p.status === 'draft' || p.status === 'scheduled'),
    ),
    publishedPosts: computed(() =>
      store.posts().filter((p) => p.status === 'published'),
    ),
    archivedPosts: computed(() =>
      store.posts().filter((p) => p.status === 'archived'),
    ),
    scheduledPosts: computed(() =>
      store.posts().filter((p) => p.status === 'scheduled'),
    ),
    // Kept for backward compatibility
    draftCount: computed(
      () =>
        store.posts().filter(
          (p) => p.status === 'draft' || p.status === 'scheduled',
        ).length,
    ),
    publishedCount: computed(
      () => store.posts().filter((p) => p.status === 'published').length,
    ),
    filteredPosts: computed(() => {
      let result = store.posts();
      const text = store.filterText().trim().toLowerCase();
      const status = store.filterStatus();
      if (text) {
        result = result.filter(
          (p) =>
            (p.title ?? '').toLowerCase().includes(text) ||
            p.slug.toLowerCase().includes(text),
        );
      }
      if (status !== 'all') {
        if (status === 'draft') {
          result = result.filter((p) => p.status === 'draft');
        } else {
          result = result.filter((p) => p.status === status);
        }
      }
      return result;
    }),
  })),

  withComputed((store) => ({
    sortedPosts: computed(() => {
      const column = store.sortBy();
      const direction = store.sortDirection();
      const dir = direction === 'asc' ? 1 : -1;
      const get = (p: BlogPost): number =>
        column === 'viewCount' ? p.viewCount ?? 0 : p.updatedAt;
      return [...store.filteredPosts()].sort((a, b) => (get(a) - get(b)) * dir);
    }),
  })),

  withMethods(
    (store, postService = inject(PostService), platformId = inject(PLATFORM_ID), seriesService = inject(SeriesService)) => ({
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

      setFilterText(text: string): void {
        patchState(store, { filterText: text });
      },

      setFilterStatus(status: PostFilterStatus | 'all'): void {
        patchState(store, { filterStatus: status });
      },

      /**
       * Two-state toggle: clicking the active column flips direction; clicking
       * a new column switches to it and defaults to descending (views and
       * dates both make most sense biggest-first on first click).
       */
      toggleSort(column: PostsSortColumn): void {
        const current = store.sortBy();
        if (current === column) {
          patchState(store, {
            sortDirection: store.sortDirection() === 'asc' ? 'desc' : 'asc',
          });
        } else {
          patchState(store, { sortBy: column, sortDirection: 'desc' });
        }
      },

      archivePost(id: string): void {
        const post = store.posts().find((p) => p.id === id);
        if (!post) return;
        const updated: BlogPost = { ...post, status: 'archived', updatedAt: Date.now() };
        postService.savePost(updated).subscribe({
          next: () => {
            patchState(store, {
              posts: store.posts().map((p) => (p.id === id ? updated : p)),
            });
            if (post.seriesId) seriesService.syncPostCount(post.seriesId).subscribe();
          },
          error: (err: unknown) => {
            console.error('[PostsListStore.archivePost]', err);
          },
        });
      },

      deletePost(id: string): void {
        const post = store.posts().find((p) => p.id === id);
        postService.deletePost(id).subscribe({
          next: () => {
            patchState(store, {
              posts: store.posts().filter((p) => p.id !== id),
            });
            if (post?.seriesId) seriesService.syncPostCount(post.seriesId).subscribe();
          },
          error: (err: unknown) => {
            console.error('[PostsListStore.deletePost]', err);
          },
        });
      },

      unpublishPost(id: string): void {
        const post = store.posts().find((p) => p.id === id);
        if (!post) return;
        const updated: BlogPost = { ...post, status: 'draft', publishedAt: 0 };
        postService.savePost(updated).subscribe({
          next: () => {
            patchState(store, {
              posts: store.posts().map((p) => (p.id === id ? updated : p)),
            });
          },
          error: (err: unknown) => {
            console.error('[PostsListStore.unpublishPost]', err);
          },
        });
      },
    }),
  ),
);
