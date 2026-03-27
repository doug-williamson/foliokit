import type { AboutPageConfig, LinksPageConfig } from '@foliokit/cms-core';

export const ABOUT_CONFIG: AboutPageConfig = {
  enabled: true,
  headline: 'Tony Stark',
  subheadline: 'Genius, billionaire, playboy, philanthropist.',
  bio: [
    '## Background',
    '',
    'MIT graduate at 17. Took over Stark Industries at 21.',
    'Pivoted the company from defence contracting to clean energy',
    'after a life-changing experience in Afghanistan.',
    '',
    '## Current work',
    '',
    '- **Arc Reactor** — miniaturised clean energy for buildings and vehicles',
    '- **Iron Man Program** — powered exoskeleton R&D (Mark L and beyond)',
    '- **Avengers Initiative** — founding member, tech lead',
    '- **Stark Relief Foundation** — disaster response and rebuilding',
    '',
    '> "Sometimes you gotta run before you can walk."',
  ].join('\n'),
  socialLinks: [
    { platform: 'github', url: 'https://github.com/stark-industries' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/tonystark' },
    { platform: 'twitter', url: 'https://x.com/tonystark' },
    { platform: 'website', url: 'https://starkindustries.com' },
  ],
  seo: {
    title: 'About — Tony Stark',
    description: 'Genius, billionaire, playboy, philanthropist. Founder of Stark Industries.',
  },
};

export const LINKS_CONFIG: LinksPageConfig = {
  enabled: true,
  headline: 'Tony Stark',
  bio: 'Links to my projects, talks, and ventures.',
  links: [
    { id: '1', label: 'Stark Industries', url: 'https://starkindustries.com', highlighted: true, order: 1 },
    { id: '2', label: 'Arc Reactor Specs (GitHub)', url: 'https://github.com/stark-industries/arc-reactor', platform: 'github', order: 2 },
    { id: '3', label: 'MIT Commencement Talk', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ', platform: 'youtube', order: 3 },
    { id: '4', label: 'Avengers Initiative', url: 'https://avengers.org', order: 4 },
    { id: '5', label: 'Stark Relief Foundation', url: 'https://starkrelief.org', order: 5 },
  ],
  seo: {
    title: 'Links — Tony Stark',
    description: 'Projects, talks, and ventures from Tony Stark.',
  },
};
