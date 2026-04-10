import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { take } from 'rxjs/operators';
import { BlogPost } from '@foliokit/cms-core';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'cms-post-publish-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: stretch;
      }
    `,
  ],
  template: `
    <button
      mat-flat-button
      type="button"
      [disabled]="isSaving()"
      (click)="onPrimaryClick()"
    >
      @if (isSaving()) {
        <mat-spinner diameter="16" style="display: inline-block" />
      } @else {
        {{ primaryLabel() }}
      }
    </button>
  `,
})
export class PostPublishButtonComponent {
  private readonly dialog = inject(MatDialog);

  readonly currentStatus = input.required<BlogPost['status']>();
  readonly isSaving = input<boolean>(false);

  readonly statusChange = output<BlogPost['status']>();

  readonly primaryLabel = computed(() =>
    this.currentStatus() === 'published' ? 'Unpublish' : 'Publish now',
  );

  readonly primaryAction = computed<BlogPost['status']>(() =>
    this.currentStatus() === 'published' ? 'draft' : 'published',
  );

  readonly requiresConfirmation = computed(() => this.primaryAction() === 'draft');

  onPrimaryClick(): void {
    if (this.requiresConfirmation()) {
      this.dialog
        .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
          data: {
            title: 'Unpublish post?',
            message: 'Are you sure you want to unpublish this post?',
            confirmLabel: 'Unpublish',
            cancelLabel: 'Keep published',
            destructive: true,
          },
        })
        .afterClosed()
        .pipe(take(1))
        .subscribe((confirmed) => {
          if (confirmed) this.statusChange.emit(this.primaryAction());
        });
    } else {
      this.statusChange.emit(this.primaryAction());
    }
  }
}
