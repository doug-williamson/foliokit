import { effect } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const ERROR_PANEL = ['save-error-snackbar'];

/** Store slice used for save completion feedback (site config editors). */
export interface SiteConfigSaveFeedbackStore {
  isSaving: () => boolean;
  saveError: () => string | null;
}

/**
 * Shows success/error snackbars when `isSaving` transitions from true to false.
 * Use for `SiteConfigEditorStore` manual saves and auto-save toggles.
 */
export function wireSiteConfigSaveSnackbarFeedback(
  store: SiteConfigSaveFeedbackStore,
  snackBar: MatSnackBar,
): void {
  let prevIsSaving = false;
  effect(() => {
    const saving = store.isSaving();
    const err = store.saveError();
    if (prevIsSaving && !saving) {
      if (err) {
        snackBar.open('Failed to save — please try again', 'Dismiss', {
          duration: 5000,
          panelClass: ERROR_PANEL,
        });
      } else {
        snackBar.open('Changes saved', undefined, { duration: 3000 });
      }
    }
    prevIsSaving = saving;
  });
}
