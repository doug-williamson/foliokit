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
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BlogPost } from '@foliokit/cms-core';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/confirm-dialog/confirm-dialog.component';

type PublishActionStatus = Exclude<BlogPost['status'], 'archived' | 'scheduled'>;

const ALL_STATUSES: PublishActionStatus[] = ['published', 'draft'];

const STATUS_LABELS: Record<PublishActionStatus, string> = {
  published: 'Published',
  draft: 'Draft',
};

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
      .primary-btn {
        border-radius: 4px 0 0 4px !important;
        min-width: 88px;
      }
      .chevron-btn {
        min-width: 36px !important;
        padding: 0 !important;
        border-radius: 0 4px 4px 0 !important;
        border-left: 1px solid rgba(0, 0, 0, 0.2) !important;
      }
    `,
  ],
  template: `
    <!-- Primary action button -->
    <button
      mat-flat-button
      class="primary-btn"
      [disabled]="isSaving()"
      (click)="onPrimaryClick()"
    >
      @if (isSaving()) {
        <mat-spinner diameter="16" style="display:inline-block;" />
      } @else {
        {{ primaryLabel() }}
      }
    </button>

    <!-- Chevron — opens mat-menu -->
    <button
      mat-flat-button
      class="chevron-btn"
      [matMenuTriggerFor]="statusMenu"
      [disabled]="isSaving()"
      aria-label="More status options"
    >
      <mat-icon svgIcon="expand_more" />
    </button>

    <mat-menu #statusMenu>
      @for (action of menuActions(); track action) {
        <button mat-menu-item (click)="statusChange.emit(action)">
          {{ statusLabels[action] }}
        </button>
      }
    </mat-menu>
  `,
})
export class PostPublishButtonComponent {
  private readonly dialog = inject(MatDialog);

  readonly currentStatus = input.required<BlogPost['status']>();
  readonly isSaving = input<boolean>(false);

  readonly statusChange = output<BlogPost['status']>();

  readonly statusLabels = STATUS_LABELS;

  readonly primaryLabel = computed(() =>
    this.currentStatus() === 'published' ? 'Unpublish' : 'Publish now',
  );

  readonly primaryAction = computed<BlogPost['status']>(() =>
    this.currentStatus() === 'published' ? 'draft' : 'published',
  );

  readonly requiresConfirmation = computed(() => this.primaryAction() === 'draft');

  readonly menuActions = computed<PublishActionStatus[]>(() => {
    const raw = this.currentStatus();
    const current: PublishActionStatus =
      raw === 'published' ? 'published' : 'draft';
    const primary = this.primaryAction();
    return ALL_STATUSES.filter((s) => s !== current && s !== primary);
  });

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
        .subscribe((confirmed) => {
          if (confirmed) this.statusChange.emit(this.primaryAction());
        });
    } else {
      this.statusChange.emit(this.primaryAction());
    }
  }
}
