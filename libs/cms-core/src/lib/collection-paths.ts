export function collectionPaths(prefix: string) {
  const p = prefix ? `${prefix}/` : '';
  return {
    posts: `${p}posts`,
    authors: `${p}authors`,
    tags: `${p}tags`,
    siteConfig: `${p}siteConfig`,
  } as const;
}
export type CollectionPathsMap = ReturnType<typeof collectionPaths>;
