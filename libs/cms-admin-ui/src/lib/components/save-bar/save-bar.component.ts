import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'folio-save-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  styles: [
    `
      .save-bar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px 16px;
        padding-bottom: max(12px, env(safe-area-inset-bottom, 0px));
        background: var(--mat-sys-surface-container-high, var(--mat-sys-surface));
        border-top: var(--border-width) solid var(--border);
        box-shadow: 0 -4px 12px color-mix(in srgb, currentColor 8%, transparent);
        transform: translateY(100%);
        transition: transform 200ms ease;
        pointer-events: none;
        visibility: hidden;
      }

      .save-bar--visible {
        transform: translateY(0);
        pointer-events: auto;
        visibility: visible;
      }

      .save-bar__actions {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }

      .save-bar__actions button {
        width: 100%;
      }

      @media (min-width: 640px) {
        .save-bar {
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
        }

        .save-bar__actions {
          flex-direction: row;
          flex-wrap: wrap;
          justify-content: flex-end;
          width: auto;
        }

        .save-bar__actions button {
          width: auto;
          min-width: 120px;
        }
      }

      .save-bar__primary-inner {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
    `,
  ],
  template: `
    <div
      class="save-bar"
      [class.save-bar--visible]="isDirty()"
      role="region"
      aria-label="Unsaved changes"
    >
      <div class="save-bar__actions">
        <button
          mat-stroked-button
          type="button"
          [disabled]="!isDirty() || isSaving()"
          (click)="discarded.emit()"
        >
          Discard
        </button>
        <button
          mat-flat-button
          color="primary"
          type="button"
          [disabled]="!isDirty() || isSaving() || saveDisabled()"
          (click)="saved.emit()"
        >
          <span class="save-bar__primary-inner">
            @if (isSaving()) {
              <mat-spinner diameter="16" />
            }
            Save Changes
          </span>
        </button>
      </div>
    </div>
  `,
})
export class SaveBarComponent {
  readonly isDirty = input.required<boolean>();
  readonly isSaving = input(false);
  readonly saveDisabled = input(false);

  readonly saved = output<void>();
  readonly discarded = output<void>();
}
