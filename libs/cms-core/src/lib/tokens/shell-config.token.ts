import { InjectionToken } from '@angular/core';
import type { NavEntry } from '../models/site-config.model';

export interface ShellConfig {
  appName: string;
  logoUrl?: string;
  showAuth?: boolean;
  nav?: NavEntry[];
}

export const SHELL_CONFIG = new InjectionToken<ShellConfig>('SHELL_CONFIG');
