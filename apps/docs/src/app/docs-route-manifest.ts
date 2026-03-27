import { DocsRouteNode } from '@foliokit/docs-ui';

export const DOCS_MANIFEST: DocsRouteNode[] = [
  {
    label: 'Getting Started',
    path: '/docs/getting-started',
    icon: 'rocket_launch',
    children: [
      { label: 'Nx Setup', path: '/docs/getting-started/nx' },
    ],
  },
  {
    label: 'AppShell',
    path: '/docs/app-shell',
    icon: 'web',
    children: [
      { label: 'API Reference', path: '/docs/app-shell/api' },
      { label: 'Theming',       path: '/docs/app-shell/theming' },
      { label: 'Examples',      path: '/docs/app-shell/examples' },
    ],
  },
  {
    label: 'Theming',
    path: '/docs/theming',
    icon: 'palette',
  },
  {
    label: 'Firebase',
    path: '/docs/firebase',
    icon: 'cloud',
  },
  {
    label: 'Components',
    path: '/docs/components/about-page',
    icon: 'widgets',
    children: [
      { label: 'AboutPage',  path: '/docs/components/about-page' },
      { label: 'LinksPage',  path: '/docs/components/links-page' },
      { label: 'Markdown',   path: '/docs/components/markdown' },
    ],
  },
  {
    label: 'LinksPage',
    path: '/docs/links-page',
    icon: 'link',
    children: [
      { label: 'API Reference', path: '/docs/links-page/api' },
      { label: 'Examples',      path: '/docs/links-page/examples' },
    ],
  },
  {
    label: 'MarkdownComponent',
    path: '/docs/markdown',
    icon: 'description',
    children: [
      { label: 'API Reference', path: '/docs/markdown/api' },
      { label: 'Examples',      path: '/docs/markdown/examples' },
    ],
  },
  {
    label: 'Token Contracts',
    path: '/docs/tokens',
    icon: 'token',
    children: [
      { label: 'SHELL_CONFIG',       path: '/docs/tokens/shell-config' },
      { label: 'SeoMeta',            path: '/docs/tokens/seo-meta' },
      { label: 'EmbeddedMediaEntry', path: '/docs/tokens/embedded-media' },
    ],
  },
];
