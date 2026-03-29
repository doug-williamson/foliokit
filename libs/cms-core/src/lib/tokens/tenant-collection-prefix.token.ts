import { InjectionToken } from '@angular/core';

export const TENANT_COLLECTION_PREFIX = new InjectionToken<string>(
  'TENANT_COLLECTION_PREFIX',
  { providedIn: 'root', factory: () => '' },
);
