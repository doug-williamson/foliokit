import { CanDeactivateFn } from '@angular/router';

export interface HasDirtyStore {
  store: { isDirty: () => boolean };
}

export const unsavedChangesGuard: CanDeactivateFn<HasDirtyStore> = (
  component,
) => {
  if (!component.store.isDirty()) return true;
  return window.confirm('You have unsaved changes. Leave anyway?');
};
