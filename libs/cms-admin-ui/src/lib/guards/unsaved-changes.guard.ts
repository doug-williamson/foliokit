import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs/operators';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../shared/confirm-dialog/confirm-dialog.component';

/**
 * Implement this interface on any component that uses `unsavedChangesGuard`
 * as a `canDeactivate` guard. The guard reads `store.isDirty()` to determine
 * whether to prompt the user before navigating away.
 */
export interface HasDirtyStore {
  store: { isDirty: () => boolean };
}

/**
 * Prevents accidental navigation away from editor pages that have unsaved
 * changes. Opens a Material dialog to confirm the navigation when
 * `store.isDirty()` returns `true`.
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
    .pipe(map((result) => result === true));
};
