import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { DocsPageMeta } from '@foliokit/docs-ui';

const META: Record<string, DocsPageMeta> = {
  'getting-started': {
    title: 'Getting Started',
    description: 'Install FolioKit and wire up your first Angular app in minutes.',
    badge: 'v1.0.0',
    headings: [
      { id: 'installation',   label: 'Installation',   level: 2 },
      { id: 'firebase-setup', label: 'Firebase Setup', level: 2 },
      { id: 'app-config',     label: 'App Config',     level: 2 },
      { id: 'next-steps',     label: 'Next Steps',     level: 2 },
    ],
  },
  'getting-started/nx': {
    title: 'Nx Monorepo Setup',
    description: 'Setting up FolioKit inside an Nx workspace.',
    headings: [
      { id: 'create-workspace', label: 'Create Workspace', level: 2 },
      { id: 'add-angular',      label: 'Add Angular',      level: 2 },
      { id: 'add-firebase',     label: 'Add Firebase',     level: 2 },
    ],
  },
  'app-shell': {
    title: 'AppShellComponent',
    description: 'The top-level layout component. Handles sidenav, header slots, and theme toggling.',
    badge: 'v1.0.0',
    headings: [
      { id: 'overview',     label: 'Overview',      level: 2 },
      { id: 'installation', label: 'Installation',  level: 2 },
      { id: 'basic-usage',  label: 'Basic Usage',   level: 2 },
      { id: 'slots',        label: 'Content Slots', level: 2 },
    ],
  },
  'app-shell/api': {
    title: 'AppShell — API Reference',
    description: 'Inputs, injection tokens, and content projection slots.',
    headings: [
      { id: 'shell-config',  label: 'SHELL_CONFIG',  level: 2 },
      { id: 'slots',         label: 'Content Slots', level: 2 },
      { id: 'theme-service', label: 'ThemeService',  level: 2 },
    ],
  },
  'app-shell/theming': {
    title: 'AppShell — Theming',
    description: 'Light/dark mode, CSS custom properties, and ThemeService.',
    headings: [
      { id: 'theme-service', label: 'ThemeService',  level: 2 },
      { id: 'css-vars',      label: 'CSS Variables', level: 2 },
      { id: 'dark-mode',     label: 'Dark Mode',     level: 2 },
    ],
  },
  'app-shell/examples': {
    title: 'AppShell — Live Examples',
    description: 'Interactive previews with scoped providers.',
  },
  'links-page': {
    title: 'LinksPageComponent',
    description: 'A Linktree-style page component driven by SocialLink config.',
    badge: 'v1.0.0',
    headings: [
      { id: 'overview',    label: 'Overview',    level: 2 },
      { id: 'basic-usage', label: 'Basic Usage', level: 2 },
      { id: 'social-link', label: 'SocialLink',  level: 2 },
    ],
  },
  'links-page/api': {
    title: 'LinksPage — API Reference',
    headings: [
      { id: 'inputs',      label: 'Inputs',     level: 2 },
      { id: 'social-link', label: 'SocialLink', level: 2 },
      { id: 'platforms',   label: 'Platforms',  level: 2 },
    ],
  },
  'links-page/examples': {
    title: 'LinksPage — Live Examples',
  },
  'markdown': {
    title: 'MarkdownComponent',
    description: 'Renders Markdown with a custom renderer and embedded media token support.',
    badge: 'v1.0.0',
    headings: [
      { id: 'overview',       label: 'Overview',       level: 2 },
      { id: 'basic-usage',    label: 'Basic Usage',    level: 2 },
      { id: 'embedded-media', label: 'Embedded Media', level: 2 },
    ],
  },
  'markdown/api': {
    title: 'MarkdownComponent — API Reference',
    headings: [
      { id: 'inputs',         label: 'Inputs',             level: 2 },
      { id: 'embedded-media', label: 'EmbeddedMediaEntry', level: 2 },
    ],
  },
  'markdown/examples': {
    title: 'MarkdownComponent — Live Examples',
  },
  'tokens': {
    title: 'Token Contracts',
    description: 'Angular injection tokens and TypeScript interfaces that form the FolioKit public API.',
    headings: [
      { id: 'shell-config',   label: 'SHELL_CONFIG',       level: 2 },
      { id: 'seo-meta',       label: 'SeoMeta',            level: 2 },
      { id: 'embedded-media', label: 'EmbeddedMediaEntry', level: 2 },
    ],
  },
  'tokens/shell-config': {
    title: 'SHELL_CONFIG Token',
    headings: [
      { id: 'interface', label: 'ShellConfig interface', level: 2 },
      { id: 'nav-item',  label: 'NavItem',               level: 2 },
      { id: 'usage',     label: 'Usage',                 level: 2 },
    ],
  },
  'tokens/seo-meta': {
    title: 'SeoMeta Interface',
    headings: [
      { id: 'interface', label: 'Interface', level: 2 },
      { id: 'usage',     label: 'Usage',     level: 2 },
    ],
  },
  'tokens/embedded-media': {
    title: 'EmbeddedMediaEntry Interface',
    headings: [
      { id: 'interface',    label: 'Interface',    level: 2 },
      { id: 'token-syntax', label: 'Token Syntax', level: 2 },
      { id: 'usage',        label: 'Usage',        level: 2 },
    ],
  },
};

export const docsPageMetaResolver: ResolveFn<DocsPageMeta> = (route: ActivatedRouteSnapshot) => {
  const key = route.pathFromRoot
    .flatMap(r => r.url)
    .map(s => s.path)
    .filter(Boolean)
    .filter(s => s !== 'docs')
    .join('/');
  return META[key] ?? { title: '' };
};
