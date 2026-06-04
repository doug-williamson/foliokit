import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  RhombusOverflowMenuComponent,
  type OverflowMenuItem,
} from '@rhombuskit/core';
import { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'cms-post-publish-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule, RhombusOverflowMenuComponent],
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: stretch;
      }
    `,
  ],
  template: `
    <div style="display: inline-flex; align-items: stretch;">
      <button
        mat-flat-button
        type="button"
        [disabled]="isSaving()"
        (click)="onPublishNow()"
        style="border-radius: 4px 0 0 4px; border-right: none"
      >
        @if (isSaving()) {
          <mat-spinner diameter="16" style="display: inline-block" />
        } @else {
          Publish now
        }
      </button>
      <rhombus-overflow-menu
        [items]="publishMenuItems()"
        triggerIcon="arrow_drop_down"
        ariaLabel="More publish options"
      />
    </div>
  `,
})
export class PostPublishButtonComponent {
  readonly currentStatus = input.required<BlogPost['status']>();
  readonly isSaving = input<boolean>(false);

  readonly statusChange = output<BlogPost['status']>();

  /** Dropdown publish options, disabled while a save is in flight. */
  protected readonly publishMenuItems = computed<OverflowMenuItem[]>(() => {
    const disabled = this.isSaving();
    return [
      { label: 'Publish now', disabled, action: () => this.onPublishNow() },
      { label: 'Schedule…', disabled, action: () => this.onSchedule() },
    ];
  });

  onPublishNow(): void {
    this.statusChange.emit('published');
  }

  onSchedule(): void {
    this.statusChange.emit('scheduled');
  }
}
