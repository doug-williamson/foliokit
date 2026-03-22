import { DocsRouteNode } from '@foliokit/docs-ui';

export const DOCS_MANIFEST: DocsRouteNode[] = [
  {
    label: 'Getting Started',
    path: '/docs/getting-started',
    children: [
      { label: 'Nx Setup', path: '/docs/getting-started/nx' },
    ],
  },
  {
    label: 'AppShell',
    path: '/docs/app-shell',
    children: [
      { label: 'API Reference', path: '/docs/app-shell/api' },
      { label: 'Theming',       path: '/docs/app-shell/theming' },
      { label: 'Examples',      path: '/docs/app-shell/examples' },
    ],
  },
  {
    label: 'LinksPage',
    path: '/docs/links-page',
    children: [
      { label: 'API Reference', path: '/docs/links-page/api' },
      { label: 'Examples',      path: '/docs/links-page/examples' },
    ],
  },
  {
    label: 'MarkdownComponent',
    path: '/docs/markdown',
    children: [
      { label: 'API Reference', path: '/docs/markdown/api' },
      { label: 'Examples',      path: '/docs/markdown/examples' },
    ],
  },
  {
    label: 'Token Contracts',
    path: '/docs/tokens',
    sectionHeader: false,
    children: [
      { label: 'SHELL_CONFIG',       path: '/docs/tokens/shell-config' },
      { label: 'SeoMeta',            path: '/docs/tokens/seo-meta' },
      { label: 'EmbeddedMediaEntry', path: '/docs/tokens/embedded-media' },
    ],
  },
];
