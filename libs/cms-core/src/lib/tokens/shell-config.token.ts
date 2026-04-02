import { InjectionToken } from '@angular/core';
import type { PlanFeatures } from '../models/plan-features.model';
import type { NavEntry } from '../models/site-config.model';

export interface ShellConfig {
  appName: string;
  logoUrl?: string;
  showAuth?: boolean;
  nav?: NavEntry[];
  features?: PlanFeatures;
}

export const SHELL_CONFIG = new InjectionToken<ShellConfig>('SHELL_CONFIG');
