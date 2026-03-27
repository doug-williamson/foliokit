import { CanDeactivateFn } from '@angular/router';

/**
 * Implement this interface on any component that uses `unsavedChangesGuard`
 * as a `canDeactivate` guard. The guard reads `store.isDirty()` to determine
 * whether to prompt the user before navigating away.
 */
export interface HasDirtyStore {
  store: { isDirty: () => boolean };
}

/**
 * Prevents accidental navigation away from editor pages that have unsaved changes.
 * Prompts the user with a browser confirmation dialog when `store.isDirty()` is true.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasDirtyStore> = (
  component,
) => {
  if (!component.store.isDirty()) return true;
  return window.confirm('You have unsaved changes. Leave anyway?');
};
