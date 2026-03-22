export interface DocsRouteNode {
  label: string;
  path: string;
  icon?: string;
  children?: DocsRouteNode[];
  badge?: string;
  sectionHeader?: boolean;
}
