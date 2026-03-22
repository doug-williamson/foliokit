export interface DocsRouteNode {
  label: string;
  path: string;
  children?: DocsRouteNode[];
  badge?: string;
  sectionHeader?: boolean;
}
