/**
 * Payload accepted by the `recordPostView` HTTPS Cloud Function.
 *
 * `sessionId` is a client-generated `crypto.randomUUID()` stored in
 * `localStorage` under `foliokit:analytics:sessionId`. It is only used
 * transiently — never persisted to Firestore in v1.
 */
export interface PostViewEvent {
  postId: string;
  sessionId: string;
  /**
   * Tenant identifier the post lives under. Required for multi-tenant
   * deployments; `'default'` (or omitted) for single-tenant. The function
   * verifies the post exists at the resolved path before incrementing,
   * so a forged tenantId can only point at a public post.
   */
  tenantId?: string;
}

/**
 * Per-day aggregate bucket written by the `recordPostView` Cloud Function
 * for `pro` and `agency` tier tenants. Stored at
 * `tenants/{tenantId}/analytics/posts/{postId}/daily/{YYYY-MM-DD}`.
 *
 * v1 records `views` only. `uniqueVisitors` is deferred — implementing it
 * requires a hashed-sessionId seen-doc per day, doubling write count per
 * beacon. Will revisit when the analytics dashboard work begins.
 */
export interface PostAnalyticsDaily {
  /** UTC date in `YYYY-MM-DD` form. */
  date: string;
  views: number;
}
