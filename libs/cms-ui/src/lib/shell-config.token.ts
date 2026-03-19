import { InjectionToken } from '@angular/core';
import type { NavItem } from '@foliokit/cms-core';

export interface ShellConfig {
  appName: string;
  logoUrl?: string;
  showAuth?: boolean;
  nav?: NavItem[];
}

export const SHELL_CONFIG = new InjectionToken<ShellConfig>('SHELL_CONFIG');
