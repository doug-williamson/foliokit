import type { Timestamp } from 'firebase/firestore';
import type { SocialLink } from './site-config.model';

export interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatarUrl?: string;
  email?: string;
  social?: SocialLink[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
