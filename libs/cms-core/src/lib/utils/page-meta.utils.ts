export const BRAND_SUFFIX = 'FolioKit';

export function buildPageTitle(pageTitle: string): string {
  return `${pageTitle} | ${BRAND_SUFFIX}`;
}
