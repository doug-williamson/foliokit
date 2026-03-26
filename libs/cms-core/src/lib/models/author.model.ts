import type { SocialLink } from './site-config.model';

export interface Author {
  id: string;
  displayName: string;
  bio?: string;
  photoUrl?: string;
  /** Firebase Storage URL — shown in dark mode when set */
  photoUrlDark?: string;
  socialLinks?: SocialLink[];
  email?: string;
  /** Unix milliseconds. */
  createdAt: number;
  /** Unix milliseconds. */
  updatedAt: number;
}
