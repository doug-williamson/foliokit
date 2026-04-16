import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

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
  selector: 'cms-plan-comparison-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>FolioKit Plans</h2>

    <mat-dialog-content>
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
                <mat-icon
                  [svgIcon]="row.starter ? 'check_circle' : 'cancel'"
                  [class.pcd-check--yes]="row.starter"
                  [class.pcd-check--no]="!row.starter"
                />
              </td>
              <td class="pcd-check">
                <mat-icon
                  [svgIcon]="row.pro ? 'check_circle' : 'cancel'"
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
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      <a mat-flat-button color="primary" routerLink="/settings" [mat-dialog-close]="true">
        Upgrade
      </a>
    </mat-dialog-actions>
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
      color: var(--teal-600);
    }

    .pcd-check {
      text-align: center;

      mat-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
        vertical-align: middle;
      }
    }

    .pcd-check--yes {
      color: var(--teal-500);
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
}
