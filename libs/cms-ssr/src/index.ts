/**
 * @foliokit/cms-ssr
 *
 * Server-side Firestore services for FolioKit SSR blogs.
 * Implements the IBlogPostService, IAuthorService, ISeriesService, and
 * ISiteConfigService contracts defined in @foliokit/cms-core, against
 * firebase-admin (server SDK) rather than firebase (client SDK).
 *
 * Server-only — do not import from browser bundles.
 */

// Phase C — services and providers added incrementally:
// - ServerSiteConfigService + provideServerSiteConfigService()
// - ServerBlogPostService + provideServerBlogPostService()
// - ServerAuthorService + provideServerAuthorService()
// - ServerSeriesService + provideServerSeriesService()
// - provideFolioKitSsr() aggregator
export {};
