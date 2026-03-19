import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  DocumentData,
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
import { from, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FIREBASE_STORAGE, FIRESTORE } from '../firebase/firebase.config';
import type { BlogPost } from '../models/post.model';

@Injectable({ providedIn: 'root' })
export class PostService {
  private readonly firestore = inject(FIRESTORE);
  private readonly storage = inject(FIREBASE_STORAGE);

  getPublishedPosts(): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, 'posts'),
      where('status', '==', 'published'),
      orderBy('publishedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) => snapshot.docs.map((d) => this.toPost(d.id, d.data()))),
      catchError((err) => {
        console.error('[PostService.getPublishedPosts]', err);
        return of([]);
      }),
    );
  }

  getPostBySlug(slug: string): Observable<BlogPost | null> {
    const q = query(
      collection(this.firestore, 'posts'),
      where('status', '==', 'published'),
      where('slug', '==', slug),
      limit(1),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) => {
        if (snapshot.empty) return null;
        const d = snapshot.docs[0];
        return this.toPost(d.id, d.data());
      }),
      catchError((err) => {
        console.error('[PostService.getPostBySlug]', err);
        return of(null);
      }),
    );
  }

  getPostsByTag(tag: string): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, 'posts'),
      where('status', '==', 'published'),
      where('tags', 'array-contains', tag),
      orderBy('publishedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) => snapshot.docs.map((d) => this.toPost(d.id, d.data()))),
      catchError((err) => {
        console.error('[PostService.getPostsByTag]', err);
        return of([]);
      }),
    );
  }

  getAllPosts(): Observable<BlogPost[]> {
    const q = query(
      collection(this.firestore, 'posts'),
      orderBy('updatedAt', 'desc'),
    );
    return from(getDocs(q)).pipe(
      map((snapshot) => snapshot.docs.map((d) => this.toPost(d.id, d.data()))),
      catchError((err) => {
        console.error('[PostService.getAllPosts]', err);
        return of([]);
      }),
    );
  }

  getPostById(id: string): Observable<BlogPost> {
    return from(getDoc(doc(this.firestore, 'posts', id))).pipe(
      map((snapshot) => {
        if (!snapshot.exists()) throw new Error(`Post not found: ${id}`);
        return this.toPost(snapshot.id, snapshot.data());
      }),
    );
  }

  deleteStorageFile(storagePath: string): Observable<void> {
    const fileRef = ref(this.storage, storagePath);
    return from(deleteObject(fileRef));
  }

  savePost(post: BlogPost): Observable<BlogPost> {
    const now = Timestamp.now();

    if (post.id === '') {
      const newId = doc(collection(this.firestore, 'posts')).id;
      const createdAt = now;
      const updatedAt = now;
      const payload = { ...post, id: newId, createdAt, updatedAt };
      return from(setDoc(doc(this.firestore, 'posts', newId), payload)).pipe(
        map(() => payload),
        catchError((err) => {
          console.error('[PostService.savePost/create]', err);
          throw err;
        }),
      );
    }

    const updatedAt = now;
    const payload = { ...post, updatedAt };
    return from(updateDoc(doc(this.firestore, 'posts', post.id), payload)).pipe(
      map(() => payload),
      catchError((err) => {
        console.error('[PostService.savePost/update]', err);
        throw err;
      }),
    );
  }

  private toPost(id: string, data: DocumentData): BlogPost {
    return {
      id,
      slug: data['slug'],
      title: data['title'],
      subtitle: data['subtitle'],
      status: data['status'],
      content: data['content'],
      excerpt: data['excerpt'],
      thumbnailUrl: data['thumbnailUrl'],
      thumbnailAlt: data['thumbnailAlt'],
      tags: data['tags'] ?? [],
      authorId: data['authorId'],
      readingTimeMinutes: data['readingTimeMinutes'],
      embeddedMedia: data['embeddedMedia'] ?? {},
      seo: data['seo'] ?? {},
      publishedAt: data['publishedAt'],
      scheduledPublishAt: data['scheduledPublishAt'],
      updatedAt: data['updatedAt'],
      createdAt: data['createdAt'],
    };
  }
}
