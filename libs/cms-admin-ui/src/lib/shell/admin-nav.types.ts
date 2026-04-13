import type { PlanTier } from '@foliokit/cms-core';
import type { EnablePageKey } from '../stores/site-config-nav.store';

export interface NavItemState {
  kind: 'item';
  id: string;
  label: string;
  route: string;
  icon: string;
  enabled: boolean;
  pageLocked: boolean;
  planLocked: boolean;
  /** When set, enable-page bottom sheet can turn this page on. */
  pageKey?: EnablePageKey;
  proTier?: PlanTier;
  /** When both page and plan gate apply, nudge enable-page before upgrade (reserved). */
  showPageBeforePlanHint?: boolean;
}

export interface NavSectionHeaderState {
  kind: 'header';
  id: string;
  label: string;
  /** Dim label when the whole section is unavailable (e.g. Publish off). */
  muted?: boolean;
}

export type AdminNavRow = NavItemState | NavSectionHeaderState;
