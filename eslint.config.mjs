import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:admin',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:admin'],
            },
            {
              sourceTag: 'scope:blog',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:ssr'],
            },
            {
              sourceTag: 'scope:ssr',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:ssr'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // form.get(name)!, @ViewChild()!, and test-fixture access make non-null
      // assertions idiomatic in Angular; keep them out of the warning stream.
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
