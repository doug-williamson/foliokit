export interface DocsPageMeta {
  title: string;
  description?: string;
  badge?: string;
  headings?: DocsTocEntry[];
}

export interface DocsTocEntry {
  id: string;
  label: string;
  level: 2 | 3;
}
