import { signal } from '@angular/core';
import type {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { unsavedChangesGuard } from './unsaved-changes.guard';
import type { PostEditorComponent } from '../post-editor/post-editor.component';

// ---------------------------------------------------------------------------
// The guard is a plain CanDeactivateFn — no TestBed needed.
// We build a minimal component-shaped object whose store.isDirty is a signal.
// CanDeactivateFn<T> = (component, currentRoute, currentState, nextState) => …
// ---------------------------------------------------------------------------

const stubSnapshot = {} as ActivatedRouteSnapshot;
const stubState = {} as RouterStateSnapshot;

function makeComponent(isDirty: boolean): PostEditorComponent {
  return {
    store: { isDirty: signal(isDirty) },
  } as unknown as PostEditorComponent;
}

function callGuard(isDirty: boolean): ReturnType<typeof unsavedChangesGuard> {
  return unsavedChangesGuard(
    makeComponent(isDirty),
    stubSnapshot,
    stubState,
    stubState,
  );
}

describe('unsavedChangesGuard', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('when isDirty is false', () => {
    it('returns true immediately (navigation proceeds)', () => {
      const result = callGuard(false);
      expect(result).toBe(true);
    });

    it('never opens a confirmation dialog', () => {
      const confirmSpy = vi.spyOn(window, 'confirm');
      callGuard(false);
      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });

  describe('when isDirty is true', () => {
    it('opens window.confirm with an appropriate message', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      callGuard(true);
      expect(confirmSpy).toHaveBeenCalledWith('You have unsaved changes. Leave anyway?');
    });

    it('returns true when the user confirms (navigation proceeds)', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const result = callGuard(true);
      expect(result).toBe(true);
    });

    it('returns false when the user cancels (navigation blocked)', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const result = callGuard(true);
      expect(result).toBe(false);
    });
  });

  describe('when no post is loaded (isDirty is false)', () => {
    it('proceeds without prompting regardless of post absence', () => {
      const confirmSpy = vi.spyOn(window, 'confirm');
      const result = callGuard(false);
      expect(result).toBe(true);
      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });
});
