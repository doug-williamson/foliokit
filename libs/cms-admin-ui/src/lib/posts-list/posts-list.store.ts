import { computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { BlogPost, PostService } from '@foliokit/cms-core';

export type PostStatus = BlogPost['status'];
export type PostFilterStatus = 'draft' | 'published';

export interface PostsListState {
  posts: BlogPost[];
  loading: boolean;
  error: string | null;
  filterText: string;
  filterStatus: PostFilterStatus | 'all';
}

const initialState: PostsListState = {
  posts: [],
  loading: false,
  error: null,
  filterText: '',
  filterStatus: 'all',
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
          result = result.filter(
            (p) => p.status === 'draft' || p.status === 'scheduled',
          );
        } else {
          result = result.filter((p) => p.status === status);
        }
      }
      return result;
    }),
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

      setFilterText(text: string): void {
        patchState(store, { filterText: text });
      },

      setFilterStatus(status: PostFilterStatus | 'all'): void {
        patchState(store, { filterStatus: status });
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
