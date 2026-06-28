import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import {
  RhombusButtonComponent,
  RhombusDialogActionsDirective,
  RhombusDialogComponent,
  RhombusIconComponent,
} from '@rhombuskit/core';

interface FeatureRow {
  label: string;
  starter: boolean;
  pro: boolean;
}

const FEATURE_ROWS: FeatureRow[] = [
  { label: 'Unlimited posts', starter: true, pro: true },
  { label: 'About & Links pages', starter: true, pro: true },
  { label: 'Custom domain', starter: false, pro: true },
  { label: 'Analytics', starter: false, pro: true },
  { label: 'Content taxonomy (series)', starter: false, pro: true },
  { label: 'Video walkthrough page', starter: false, pro: true },
  { label: 'Donate page', starter: false, pro: true },
  { label: 'Custom CSS', starter: false, pro: false },
  { label: 'Multiple authors', starter: false, pro: false },
];

@Component({
  selector: 'admin-plan-comparison-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RhombusButtonComponent,
    RhombusDialogComponent,
    RhombusDialogActionsDirective,
    RhombusIconComponent,
  ],
  template: `
    <rhombus-dialog title="FolioKit Plans">
      <table class="pcd-table">
        <thead>
          <tr>
            <th class="pcd-col-feature">Feature</th>
            <th class="pcd-col-tier">Free</th>
            <th class="pcd-col-tier pcd-col-tier--pro">Pro</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track row.label) {
            <tr>
              <td class="pcd-label">{{ row.label }}</td>
              <td class="pcd-check">
                <rhombus-icon
                  [name]="row.starter ? 'check_circle' : 'cancel'"
                  [class.pcd-check--yes]="row.starter"
                  [class.pcd-check--no]="!row.starter"
                />
              </td>
              <td class="pcd-check">
                <rhombus-icon
                  [name]="row.pro ? 'check_circle' : 'cancel'"
                  [class.pcd-check--yes]="row.pro"
                  [class.pcd-check--no]="!row.pro"
                />
              </td>
            </tr>
          }
        </tbody>
      </table>
      <p class="pcd-note">
        Agency plan ($29/mo) includes everything in Pro, plus Custom CSS, Multiple authors, and additional page types.
      </p>

      <div rhombusDialogActions>
        <rhombus-button appearance="text" variant="secondary" (click)="dialogRef.close()">
          Close
        </rhombus-button>
        <rhombus-button (click)="upgrade()">Upgrade</rhombus-button>
      </div>
    </rhombus-dialog>
  `,
  styles: [`
    .pcd-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 16px;

      th {
        padding: 8px 12px;
        text-align: left;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: var(--text-muted);
        border-bottom: var(--border-width) solid var(--border);
        font-family: var(--font-mono);
      }

      td {
        padding: 8px 12px;
        border-bottom: var(--border-width) solid var(--border);
        color: var(--text-primary);
        vertical-align: middle;
      }
    }

    .pcd-col-tier {
      text-align: center;
      min-width: 64px;
    }

    .pcd-col-tier--pro {
      color: var(--text-accent);
    }

    .pcd-check {
      text-align: center;

      rhombus-icon {
        --rhombus-icon-size: 18px;
        vertical-align: middle;
      }
    }

    .pcd-check--yes {
      color: var(--text-accent);
    }

    .pcd-check--no {
      color: var(--text-disabled);
    }

    .pcd-note {
      font-size: 12px;
      color: var(--text-muted);
      line-height: 1.5;
      margin: 0;
    }
  `],
})
export class PlanComparisonDialogComponent {
  protected readonly rows: FeatureRow[] = FEATURE_ROWS;
  protected readonly dialogRef = inject(MatDialogRef<PlanComparisonDialogComponent>);
  private readonly router = inject(Router);

  /** Close the dialog and head to billing/settings to upgrade. */
  protected upgrade(): void {
    this.dialogRef.close();
    this.router.navigate(['/settings']);
  }
}
