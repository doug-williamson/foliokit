import { inject, Injectable } from '@angular/core';
import { SITE_ID } from './foliokit.providers';

// ── Pure functions ──────────────────────────────────────────────────────────
// Use these in server-side services (Admin SDK), Cloud Functions, or tests
// where Angular DI is not available.

function isMultiTenant(siteId: string | null | undefined): siteId is string {
  return siteId != null && siteId !== 'default';
}

/**
 * Resolves a Firestore collection path, scoped to a site when multi-tenant.
 *
 * - `resolveCollectionPath('posts')` → `'posts'`
 * - `resolveCollectionPath('posts', 'stark')` → `'sites/stark/posts'`
 * - `resolveCollectionPath('posts', 'default')` → `'posts'`
 */
export function resolveCollectionPath(
  name: 'posts' | 'authors' | 'tags',
  siteId?: string | null,
): string {
  return isMultiTenant(siteId) ? `sites/${siteId}/${name}` : name;
}

/**
 * Resolves the full Firestore document path for a site-config document.
 *
 * - `resolveSiteConfigDocPath('default')` → `'site-config/default'`
 * - `resolveSiteConfigDocPath('stark', 'stark')` → `'sites/stark/site-config/stark'`
 */
export function resolveSiteConfigDocPath(
  docId: string,
  siteId?: string | null,
): string {
  return isMultiTenant(siteId)
    ? `sites/${siteId}/site-config/${docId}`
    : `site-config/${docId}`;
}

/**
 * Resolves a Firebase Storage path, scoped to a site when multi-tenant.
 *
 * - `resolveStoragePath('posts/abc/cover/img.jpg')` → `'posts/abc/cover/img.jpg'`
 * - `resolveStoragePath('posts/abc/cover/img.jpg', 'stark')` → `'sites/stark/posts/abc/cover/img.jpg'`
 */
export function resolveStoragePath(
  relativePath: string,
  siteId?: string | null,
): string {
  return isMultiTenant(siteId) ? `sites/${siteId}/${relativePath}` : relativePath;
}

// ── Injectable service ──────────────────────────────────────────────────────
// Use in Angular components and services that have access to DI.

/**
 * Centralized path resolver for Firestore collections and Firebase Storage.
 *
 * Injects {@link SITE_ID} (optional) and delegates to the pure helper
 * functions. When `SITE_ID` is absent or `'default'`, all paths resolve to
 * root-level collections — identical to the pre-multi-tenancy layout.
 *
 * @example
 * ```ts
 * private readonly paths = inject(CollectionPaths);
 *
 * // Firestore
 * collection(this.firestore, this.paths.collection('posts'))
 *
 * // Storage
 * ref(this.storage, this.paths.storagePath(`posts/${id}/cover/${name}`))
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CollectionPaths {
  readonly siteId = inject(SITE_ID, { optional: true }) ?? null;

  /** Resolves a Firestore collection path for the current site context. */
  collection(name: 'posts' | 'authors' | 'tags'): string {
    return resolveCollectionPath(name, this.siteId);
  }

  /** Resolves the full Firestore doc path for the current site's config. */
  siteConfigDocPath(docId?: string): string {
    return resolveSiteConfigDocPath(docId ?? this.siteId ?? 'default', this.siteId);
  }

  /** Resolves a Firebase Storage path for the current site context. */
  storagePath(relativePath: string): string {
    return resolveStoragePath(relativePath, this.siteId);
  }
}
