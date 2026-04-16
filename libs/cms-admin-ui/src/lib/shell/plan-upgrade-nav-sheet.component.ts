import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { PlanComparisonDialogComponent } from '../plan-gate/plan-comparison-dialog.component';

const UPGRADE_URL = '/settings';
const UPGRADE_FRAGMENT = 'billing';

@Component({
  selector: 'folio-plan-upgrade-nav-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatBottomSheetModule, MatButtonModule, RouterLink],
  template: `
    <div class="folio-upgrade-sheet">
      <h2 class="folio-upgrade-sheet__title">Upgrade plan</h2>
      <p class="folio-upgrade-sheet__body">
        This area needs a higher FolioKit plan. Open billing to upgrade, or compare plans below.
      </p>
      <a
        mat-flat-button
        color="primary"
        class="folio-upgrade-sheet__cta"
        [routerLink]="upgradeUrl"
        [fragment]="upgradeFragment"
        (click)="close()"
      >
        View billing and upgrade
      </a>
      <button type="button" class="folio-upgrade-sheet__link" (click)="openComparison()">
        See what is included
      </button>
    </div>
  `,
  styles: [
    `
      .folio-upgrade-sheet {
        padding: 24px 24px 32px;
        max-width: 480px;
      }
      .folio-upgrade-sheet__title {
        margin: 0 0 12px;
        font-size: 1.25rem;
        font-weight: 600;
      }
      .folio-upgrade-sheet__body {
        margin: 0 0 20px;
        font-size: 0.9375rem;
        line-height: 1.5;
        color: var(--text-secondary);
      }
      .folio-upgrade-sheet__cta {
        width: 100%;
        text-align: center;
        text-decoration: none;
      }
      .folio-upgrade-sheet__link {
        margin-top: 16px;
        width: 100%;
        background: none;
        border: none;
        font-size: 0.8125rem;
        color: var(--text-accent, #1565c0);
        cursor: pointer;
        font-family: inherit;
      }
    `,
  ],
})
export class PlanUpgradeNavSheetComponent {
  private readonly sheetRef = inject(MatBottomSheetRef<PlanUpgradeNavSheetComponent>);
  private readonly dialog = inject(MatDialog);

  protected readonly upgradeUrl = UPGRADE_URL;
  protected readonly upgradeFragment = UPGRADE_FRAGMENT;

  protected close(): void {
    this.sheetRef.dismiss();
  }

  protected openComparison(): void {
    this.dialog.open(PlanComparisonDialogComponent, {
      maxWidth: '480px',
      width: '90vw',
    });
  }
}
