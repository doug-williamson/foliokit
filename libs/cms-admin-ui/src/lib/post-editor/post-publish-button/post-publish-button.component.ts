import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'cms-post-publish-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatProgressSpinnerModule],
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
      <button
        mat-flat-button
        type="button"
        [disabled]="isSaving()"
        [matMenuTriggerFor]="publishMenu"
        style="border-radius: 0 4px 4px 0; min-width: 32px; padding: 0 4px"
        aria-label="More publish options"
      >
        <mat-icon svgIcon="arrow_drop_down" style="margin: 0" />
      </button>
    </div>
    <mat-menu #publishMenu>
      <button mat-menu-item type="button" (click)="onPublishNow()">Publish now</button>
      <button mat-menu-item type="button" (click)="onSchedule()">Schedule…</button>
    </mat-menu>
  `,
})
export class PostPublishButtonComponent {
  readonly currentStatus = input.required<BlogPost['status']>();
  readonly isSaving = input<boolean>(false);

  readonly statusChange = output<BlogPost['status']>();

  onPublishNow(): void {
    this.statusChange.emit('published');
  }

  onSchedule(): void {
    this.statusChange.emit('scheduled');
  }
}
