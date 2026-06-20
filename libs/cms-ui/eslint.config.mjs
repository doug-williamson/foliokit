import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],
          // Deps the rule structurally can't analyze from TS imports:
          //  - @rhombuskit/tokens: CSS-only (consumed via styles), no TS import,
          //    but a legitimate peerDependency consumers must install.
          //  - vitest: dev/test tool used via globals; must NOT be a published peer.
          ignoredDependencies: [
            // SCSS-only / transitive Material peer the rule can't see from TS.
            '@angular/cdk',
            '@rhombuskit/material-preset',
            '@rhombuskit/tokens',
            'vitest',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: ['lib', 'folio', 'blog', 'cms'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: ['lib', 'folio', 'blog', 'cms'],
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    // Override or add rules here
    rules: {},
  },
];
