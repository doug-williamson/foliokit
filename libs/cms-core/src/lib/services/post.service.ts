import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { forkJoin, from, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CollectionPaths } from '../firebase/collection-paths';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase/firebase.config';
import type { BlogPost } from '../models/post.model';
import { normalizePost } from '../utils/normalize-post';
import type { IBlogPostService } from '../tokens/post-service.token';

/** Firestore inequality/order queries require Timestamp, not numeric ms. */
function blogPostFirestoreTimestampFields(post: BlogPost): Record<string, Timestamp> {
  const extra: Record<string, Timestamp> = {};
  if (typeof post.scheduledPublishAt === 'number' && Number.isFinite(post.scheduledPublishAt)) {
    extra['scheduledPublishAt'] = Timestamp.fromMillis(post.scheduledPublishAt);
  }
  if (typeof post.publishedAt === 'number' && Number.isFinite(post.publishedAt) && post.publishedAt > 0) {
    extra['publishedAt'] = Timestamp.fromMillis(post.publishedAt);
  }
  return extra;
}

@Injectable({ providedIn: 'root' })
export class PostService implements IBlogPostService {
  // Non-null assertions are safe: PostService is only active in the browser
  // where FIRESTORE and FIREBASE_STORAGE are always initialized.
  // On the server, BLOG_POST_SERVICE resolves to ServerBlogPostService instead.
  private readonly firestore = inject(FIRESTORE)!;
  private readonly storage = inject(FIREBASE_STORAGE)!;
  private readonly paths = inject(CollectionPaths);

  getPublishedPosts(): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, this.paths.collection('posts')),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizePost({ id: d.id, ...d.data() })),
      ),
      catchError((err) => {
        console.error('[PostService.getPublishedPosts]', err);
        return of([]);
      }),
    );
  }

  getPostBySlug(slug: string): Observable<BlogPost | null> {
    const q = query(
      collection(this.firestore, this.paths.collection('posts')),
      where('status', '==', 'published'),
      where('slug', '==', slug),
      limit(1),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        if (snapshot.empty) return null;
        const d = snapshot.docs[0];
        return normalizePost({ id: d.id, ...d.data() });
      }),
      catchError((err) => {
        console.error('[PostService.getPostBySlug]', err);
        return of(null);
      }),
    );
  }

  getPostsByTag(tag: string): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, this.paths.collection('posts')),
      where('status', '==', 'published'),
      where('tags', 'array-contains', tag),
      orderBy('publishedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizePost({ id: d.id, ...d.data() })),
      ),
      catchError((err) => {
        console.error('[PostService.getPostsByTag]', err);
        return of([]);
      }),
    );
  }

  getBySeriesId(seriesId: string): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, this.paths.collection('posts')),
      where('seriesId', '==', seriesId),
      orderBy('publishedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizePost({ id: d.id, ...d.data() })),
      ),
      catchError((err) => {
        console.error('[PostService.getBySeriesId]', err);
        return of([]);
      }),
    );
  }

  getAllPosts(): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, this.paths.collection('posts')),
      orderBy('updatedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) =>
        snapshot.docs.map((d) => normalizePost({ id: d.id, ...d.data() })),
      ),
      catchError((err: unknown) => {
        if ((err as { code?: string })?.code !== 'permission-denied') {
          console.error('[PostService.getAllPosts]', err);
        }
        return of([]);
      }),
    );
  }

  getPostById(id: string): Observable<BlogPost> {
    return from(getDoc(doc(this.firestore, this.paths.collection('posts'), id))).pipe(
      map((snapshot) => {
        if (!snapshot.exists()) throw new Error(`Post not found: ${id}`);
        return normalizePost({ id: snapshot.id, ...snapshot.data() });
      }),
    );
  }

  deleteStorageFile(storagePath: string): Observable<void> {
    const fileRef = ref(this.storage, storagePath);
    return from(deleteObject(fileRef));
  }

  deletePost(id: string): Observable<void> {
    return this.getPostById(id).pipe(
      switchMap((post) => {
        const entries = Object.values(post.embeddedMedia);
        const firestoreDelete = from(
          deleteDoc(doc(this.firestore, this.paths.collection('posts'), id)),
        );
        if (entries.length === 0) return firestoreDelete;
        return forkJoin(
          entries.map((e) =>
            this.deleteStorageFile(e.storagePath).pipe(catchError(() => of(void 0))),
          ),
        ).pipe(switchMap(() => firestoreDelete));
      }),
      catchError((err) => {
        console.error('[PostService.deletePost]', err);
        throw err;
      }),
    );
  }

  savePost(post: BlogPost): Observable<BlogPost> {
    const nowMs = Date.now();
    const nowTs = Timestamp.fromMillis(nowMs);

    if (post.status === 'scheduled') {
      const { scheduledPublishAt: _, ...rest } = post;
      post = { ...rest, status: 'draft' };
    }

    if (post.id === '') {
      const newId = doc(collection(this.firestore, this.paths.collection('posts'))).id;
      const savedPost: BlogPost = { ...post, id: newId, createdAt: nowMs, updatedAt: nowMs };
      // Write Timestamp objects to Firestore for proper ordering/querying
      const firestorePayload = {
        ...savedPost,
        createdAt: nowTs,
        updatedAt: nowTs,
        ...blogPostFirestoreTimestampFields(savedPost),
      };
      return from(
        setDoc(doc(this.firestore, this.paths.collection('posts'), newId), firestorePayload),
      ).pipe(
        map(() => savedPost),
        catchError((err) => {
          console.error('[PostService.savePost/create]', err);
          throw err;
        }),
      );
    }

    const savedPost: BlogPost = { ...post, updatedAt: nowMs };
    const firestorePayload: Record<string, unknown> = {
      ...savedPost,
      updatedAt: nowTs,
      ...blogPostFirestoreTimestampFields(savedPost),
    };
    if (savedPost.scheduledPublishAt === undefined) {
      firestorePayload['scheduledPublishAt'] = deleteField();
    }
    return from(
      updateDoc(doc(this.firestore, this.paths.collection('posts'), post.id), firestorePayload),
    ).pipe(
      map(() => savedPost),
      catchError((err) => {
        console.error('[PostService.savePost/update]', err);
        throw err;
      }),
    );
  }
}
