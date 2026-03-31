/**
 * Static tenant ID for this blog app — must match {@link providesFolioKit} in app.config.ts.
 * When hostname resolution yields `default` (e.g. localhost), SSR still uses this so Firestore
 * paths match the browser and TransferState is not populated with an empty root-level query.
 */
export const BLOG_STATIC_SITE_ID = 'foliokit';
