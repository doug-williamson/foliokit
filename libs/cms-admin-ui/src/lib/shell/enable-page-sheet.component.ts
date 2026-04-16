import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { take } from 'rxjs/operators';
import type { EnablePageKey } from '../stores/site-config-nav.store';
import { SiteConfigNavStore } from '../stores/site-config-nav.store';

export interface EnablePageSheetData {
  page: EnablePageKey;
  title: string;
  description: string;
}

@Component({
  selector: 'folio-enable-page-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatBottomSheetModule, MatButtonModule],
  template: `
    <div class="folio-enable-sheet">
      <h2 class="folio-enable-sheet__title">{{ data.title }}</h2>
      <p class="folio-enable-sheet__body">{{ data.description }}</p>
      @if (store.saveError()) {
        <p class="folio-enable-sheet__err">{{ store.saveError() }}</p>
      }
      <button
        type="button"
        mat-flat-button
        color="primary"
        class="folio-enable-sheet__cta"
        [disabled]="store.isSaving()"
        (click)="enable()"
      >
        {{ store.isSaving() ? 'Saving…' : 'Enable Page' }}
      </button>
    </div>
  `,
  styles: [
    `
      .folio-enable-sheet {
        padding: 24px 24px 32px;
        max-width: 480px;
      }
      .folio-enable-sheet__title {
        margin: 0 0 12px;
        font-size: 1.25rem;
        font-weight: 600;
      }
      .folio-enable-sheet__body {
        margin: 0 0 20px;
        font-size: 0.9375rem;
        line-height: 1.5;
        color: var(--text-secondary);
      }
      .folio-enable-sheet__err {
        margin: 0 0 12px;
        font-size: 0.8125rem;
        color: var(--mat-sys-error);
      }
      .folio-enable-sheet__cta {
        width: 100%;
      }
    `,
  ],
})
export class EnablePageSheetComponent {
  protected readonly data = inject<EnablePageSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(MatBottomSheetRef<EnablePageSheetComponent>);
  protected readonly store = inject(SiteConfigNavStore);

  protected enable(): void {
    this.store
      .enablePage(this.data.page)
      .pipe(take(1))
      .subscribe({
        next: () => this.sheetRef.dismiss(),
        error: () => {
          /* Errors surfaced via SiteConfigNavStore.saveError */
        },
      });
  }
}
