import { effect, inject } from '@angular/core';
import { RhombusToastService } from '@rhombuskit/core';

/** Store slice used for save completion feedback (site config editors). */
export interface SiteConfigSaveFeedbackStore {
  isSaving: () => boolean;
  saveError: () => string | null;
}

/**
 * Shows success/error toasts when `isSaving` transitions from true to false.
 * Use for `SiteConfigEditorStore` manual saves and auto-save toggles.
 *
 * Must be called from an injection context (component constructor / field
 * initializer): it injects {@link RhombusToastService} and registers an
 * `effect`.
 */
export function wireSiteConfigSaveSnackbarFeedback(
  store: SiteConfigSaveFeedbackStore,
): void {
  const toast = inject(RhombusToastService);
  let prevIsSaving = false;
  effect(() => {
    const saving = store.isSaving();
    const err = store.saveError();
    if (prevIsSaving && !saving) {
      if (err) {
        toast.error('Failed to save — please try again', { action: 'Dismiss' });
      } else {
        toast.success('Changes saved', { duration: 3000 });
      }
    }
    prevIsSaving = saving;
  });
}
