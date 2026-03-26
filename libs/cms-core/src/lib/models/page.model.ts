import type { SocialPlatform } from './site-config.model';

export interface LinksLink {
  id: string;
  label: string;
  url: string;
  icon?: string;
  platform?: SocialPlatform;
  highlighted?: boolean;
  order: number;
}
