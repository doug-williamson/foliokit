import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { tap } from 'rxjs/operators';
import { RhombusConfirmService } from '@rhombuskit/core';

/**
 * Implement this interface on any component that uses `unsavedChangesGuard`
 * as a `canDeactivate` guard. The guard reads `store.isDirty()` to determine
 * whether to prompt the user before navigating away, and calls `store.discard()`
 * when the user chooses to leave so the store is clean on the next visit.
 */
export interface HasDirtyStore {
  store: { isDirty: () => boolean; discard?: () => void };
}

/**
 * Prevents accidental navigation away from editor pages that have unsaved
 * changes. Opens a Material dialog to confirm the navigation when
 * `store.isDirty()` returns `true`. When the user confirms leaving,
 * calls `store.discard()` to reset dirty state before the route is torn down.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasDirtyStore> = (
  component,
) => {
  if (!component.store.isDirty()) return true;
  // RhombusConfirmService.confirm() emits true on confirm, false on cancel/dismiss —
  // exactly the boolean CanDeactivate needs, so we return it directly.
  return inject(RhombusConfirmService)
    .confirm({
      title: 'Unsaved changes',
      message: 'You have unsaved changes. Leave anyway?',
      confirmLabel: 'Leave',
      cancelLabel: 'Stay',
      variant: 'default',
    })
    .pipe(tap((confirmed) => { if (confirmed) component.store.discard?.(); }));
};
