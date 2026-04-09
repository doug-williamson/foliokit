import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { map, tap } from 'rxjs/operators';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../shared/confirm-dialog/confirm-dialog.component';

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
  const dialog = inject(MatDialog);
  return dialog
    .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Unsaved changes',
          message: 'You have unsaved changes. Leave anyway?',
          confirmLabel: 'Leave',
          cancelLabel: 'Stay',
          destructive: false,
        },
        width: '380px',
        autoFocus: 'dialog',
      },
    )
    .afterClosed()
    .pipe(
      tap((result) => { if (result === true) component.store.discard?.(); }),
      map((result) => result === true),
    );
};
