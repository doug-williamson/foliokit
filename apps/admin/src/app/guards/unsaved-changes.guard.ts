import { CanDeactivateFn } from '@angular/router';
import { PostEditorComponent } from '../post-editor/post-editor.component';

export const unsavedChangesGuard: CanDeactivateFn<PostEditorComponent> = (
  component,
) => {
  if (!component.store.isDirty()) return true;
  return window.confirm('You have unsaved changes. Leave anyway?');
};
