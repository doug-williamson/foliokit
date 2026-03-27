import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Shared chrome for admin editor pages.
 *
 * Provides a consistent toolbar (title + save-status indicator), a
 * scrollable body content-projection slot, and a sticky save/discard
 * footer. Consuming page components only need to supply the body content
 * and wire the `save` / `discard` outputs.
 *
 * **Usage**
 * ```html
 * <folio-admin-editor-page
 *   title="Site Configuration"
 *   [isSaving]="store.isSaving()"
 *   [isDirty]="store.isDirty()"
 *   [saveError]="store.saveError()"
 *   [loading]="!store.config()"
 *   (save)="onSave()"
 *   (discard)="onDiscard()"
 * >
 *   <!-- Your scrollable form content here -->
 * </folio-admin-editor-page>
 * ```
 */
@Component({
  selector: 'folio-admin-editor-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
    `,
  ],
  template: `
    <div class="flex flex-col h-full overflow-hidden relative">
      <!-- Header / toolbar -->
      <div
        class="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style="border-color: color-mix(in srgb, currentColor 12%, transparent)"
      >
        <h1 class="flex-1 text-xl font-semibold">{{ title() }}</h1>
        @if (isSaving()) {
          <span class="text-xs opacity-40">Saving…</span>
        } @else if (saveError()) {
          <span class="text-xs text-red-500">{{ saveError() }}</span>
        }
      </div>

      @if (loading()) {
        <!-- Loading state -->
        <div class="flex items-center justify-center flex-1">
          <mat-spinner diameter="40" />
        </div>
      } @else {
        <!-- Body -->
        <div class="flex-1 overflow-hidden min-h-0">
          <ng-content />
        </div>

        <!-- Sticky footer: save / discard -->
        <div
          class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-4 sm:px-6 py-3 border-t shrink-0"
          style="border-color: color-mix(in srgb, currentColor 12%, transparent); background: var(--mat-sys-surface)"
        >
          @if (isDirty()) {
            <span class="text-sm opacity-60 sm:flex-1">You have unsaved changes.</span>
          } @else {
            <span class="hidden sm:block sm:flex-1"></span>
          }
          <div class="flex justify-end gap-2">
            <button
              mat-stroked-button
              [disabled]="!isDirty() || isSaving()"
              (click)="discard.emit()"
            >
              {{ discardLabel() }}
            </button>
            <button
              mat-flat-button
              [disabled]="!isDirty() || saveDisabled() || isSaving()"
              (click)="save.emit()"
            >
              {{ saveLabel() }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminEditorPageLayoutComponent {
  /** Page title shown in the toolbar. */
  title = input.required<string>();

  /** Whether a save is currently in progress. */
  isSaving = input<boolean>(false);

  /** Whether the editor has unsaved changes. */
  isDirty = input<boolean>(false);

  /** Save error message, or null/undefined when there is no error. */
  saveError = input<string | null>(null);

  /** When true the body is hidden and a loading spinner is shown instead. */
  loading = input<boolean>(false);

  /**
   * Extra disabled condition for the Save button beyond `!isDirty`.
   * Use this to prevent saving when forms are invalid.
   */
  saveDisabled = input<boolean>(false);

  /** Label for the primary save button. Defaults to `"Save Changes"`. */
  saveLabel = input<string>('Save Changes');

  /** Label for the discard/cancel button. Defaults to `"Cancel"`. */
  discardLabel = input<string>('Cancel');

  /** Emitted when the user clicks the Save button. */
  save = output<void>();

  /** Emitted when the user clicks the Cancel/Discard button. */
  discard = output<void>();
}
