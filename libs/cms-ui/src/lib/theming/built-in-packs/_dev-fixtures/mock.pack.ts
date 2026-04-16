import type { ThemePack } from '../../theme-pack.model';

/**
 * DEV FIXTURE — NOT FOR PRODUCTION USE.
 * Overrides a handful of highly visible tokens with obviously wrong values so
 * manual visual validation is trivial. Never import from the public barrel.
 */
export const MOCK_DEV_PACK: ThemePack = {
  id: 'dev-mock',
  name: 'Dev Mock (Not for Production)',
  version: '0.0.0',
  description: 'Dev-only fixture for validating ThemePackService token application',
  tokens: {
    light: {
      '--bg': '#FF00FF',
      '--btn-primary-bg': '#FF6600',
      '--text-accent': '#FF0000',
    },
    dark: {
      '--bg': '#00FFFF',
      '--btn-primary-bg': '#FF6600',
      '--text-accent': '#FF0000',
    },
  },
};
