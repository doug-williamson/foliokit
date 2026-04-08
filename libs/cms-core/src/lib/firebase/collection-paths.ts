import { inject, Injectable } from '@angular/core';
import { SITE_ID } from './foliokit.providers';

// ── Pure functions ──────────────────────────────────────────────────────────
// Use these in server-side services (Admin SDK), Cloud Functions, or tests
// where Angular DI is not available.

function isMultiTenant(tenantId: string | null | undefined): tenantId is string {
  return tenantId != null && tenantId !== 'default';
}

/**
 * Resolves a Firestore collection path, scoped to a tenant when multi-tenant.
 *
 * - `resolveCollectionPath('posts')` → `'posts'`
 * - `resolveCollectionPath('posts', 'stark')` → `'tenants/stark/posts'`
 * - `resolveCollectionPath('posts', 'default')` → `'posts'`
 */
export function resolveCollectionPath(
  name: 'posts' | 'authors' | 'tags' | 'pages' | 'pillars' | 'series',
  tenantId?: string | null,
): string {
  return isMultiTenant(tenantId) ? `tenants/${tenantId}/${name}` : name;
}

/**
 * Resolves the full Firestore document path for a site-config document.
 *
 * - `resolveSiteConfigDocPath('default')` → `'site-config/default'`
 * - `resolveSiteConfigDocPath('stark', 'stark')` → `'tenants/stark/site-config/stark'`
 */
export function resolveSiteConfigDocPath(
  docId: string,
  tenantId?: string | null,
): string {
  return isMultiTenant(tenantId)
    ? `tenants/${tenantId}/site-config/${docId}`
    : `site-config/${docId}`;
}

/**
 * Resolves a Firebase Storage path, scoped to a tenant when multi-tenant.
 *
 * - `resolveStoragePath('posts/abc/cover/img.jpg')` → `'posts/abc/cover/img.jpg'`
 * - `resolveStoragePath('posts/abc/cover/img.jpg', 'stark')` → `'tenants/stark/posts/abc/cover/img.jpg'`
 */
export function resolveStoragePath(
  relativePath: string,
  tenantId?: string | null,
): string {
  return isMultiTenant(tenantId) ? `tenants/${tenantId}/${relativePath}` : relativePath;
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
  readonly tenantId = inject(SITE_ID, { optional: true }) ?? null;

  constructor() {
    if (this.tenantId == null && typeof ngDevMode !== 'undefined' && ngDevMode) {
      console.warn(
        '[FolioKit] No SITE_ID provided — data resolves to root-level Firestore paths. ' +
        'Set siteId in provideFolioKit() to use tenant-scoped paths. ' +
        'Root-level path support will be removed in a future major version.',
      );
    }
  }

  /** Resolves a Firestore collection path for the current tenant context. */
  collection(name: 'posts' | 'authors' | 'tags' | 'pages' | 'pillars' | 'series'): string {
    return resolveCollectionPath(name, this.tenantId);
  }

  /** Resolves the full Firestore doc path for the current tenant's config. */
  siteConfigDocPath(docId?: string): string {
    return resolveSiteConfigDocPath(docId ?? this.tenantId ?? 'default', this.tenantId);
  }

  /** Resolves a Firebase Storage path for the current tenant context. */
  storagePath(relativePath: string): string {
    return resolveStoragePath(relativePath, this.tenantId);
  }
}
