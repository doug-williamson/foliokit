import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { from, last } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { SiteConfigNavStore, type EnablePageKey } from '../stores/site-config-nav.store';

@Component({
  selector: 'admin-setup-prompt',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatCheckboxModule, MatSnackBarModule],
  styles: [
    `
      :host {
        display: block;
      }

      .onboarding-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100%;
        padding: 40px 16px;
        background: var(--bg);
      }

      .onboarding-card {
        width: 100%;
        max-width: 440px;
        background: var(--surface-1);
        border: var(--border-width) solid var(--border);
        border-radius: var(--r-lg);
        padding: 32px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .onboarding-heading {
        font-family: var(--font-display);
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }

      .onboarding-sub {
        font-size: 14px;
        color: var(--text-muted);
        margin: 0;
        line-height: 1.45;
      }

      .page-rows {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .page-row {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 10px 0;
        border-bottom: var(--border-width) solid var(--border);
      }

      .page-row:last-child {
        border-bottom: none;
      }

      .page-row mat-checkbox {
        flex: 1;
        min-width: 0;
      }

      .page-row-label {
        flex: 1;
        font-size: 15px;
        font-weight: 500;
        color: var(--text-primary);
      }

      .required-page-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
      .required-check-icon { width: 20px; height: 20px; border-radius: 4px; background: var(--btn-primary-bg); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
      .required-label { flex: 1; font-size: 14px; }
      .required-pill { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 8px; border-radius: 100px; background: var(--surface-2); color: var(--text-muted); border: 1px solid var(--border); }

      .save-btn {
        width: 100%;
      }
    `,
  ],
  template: `
    @if (hasIncompleteItems()) {
      <div class="onboarding-wrap">
        <div class="onboarding-card">
          <div>
            <h2 class="onboarding-heading">Set up your site</h2>
            <p class="onboarding-sub">Choose which pages to enable. You can change these any time.</p>
          </div>

          <div class="page-rows">
            <div class="required-page-row">
              <div class="required-check-icon">✓</div>
              <span class="required-label">Home page</span>
              <span class="required-pill">Required</span>
            </div>
            <div class="required-page-row">
              <div class="required-check-icon">✓</div>
              <span class="required-label">Blog page</span>
              <span class="required-pill">Required</span>
            </div>
            <div class="page-row">
              <mat-checkbox
                [checked]="aboutEnabled()"
                (change)="onAboutChange($event)"
              >
                <span class="page-row-label">About page</span>
              </mat-checkbox>
            </div>
            <div class="page-row">
              <mat-checkbox
                [checked]="linksEnabled()"
                (change)="onLinksChange($event)"
              >
                <span class="page-row-label">Links page</span>
              </mat-checkbox>
            </div>
          </div>

          <button
            mat-flat-button
            color="primary"
            class="save-btn"
            (click)="save()"
            [disabled]="isSaving()"
          >
            Save and continue
          </button>
        </div>
      </div>
    }
  `,
})
export class SetupPromptComponent {
  private readonly store = inject(SiteConfigNavStore);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly aboutEnabled = signal(false);
  readonly linksEnabled = signal(false);
  readonly isSaving = this.store.isSaving;

  readonly hasIncompleteItems = computed(() => {
    if (!this.store.isLoaded()) return false;
    return !this.store.config()?.onboardingComplete;
  });

  onAboutChange(event: MatCheckboxChange): void {
    this.aboutEnabled.set(event.checked);
  }

  onLinksChange(event: MatCheckboxChange): void {
    this.linksEnabled.set(event.checked);
  }

  save(): void {
    const keys: EnablePageKey[] = ['home', 'blog'];
    if (this.aboutEnabled()) keys.push('about');
    if (this.linksEnabled()) keys.push('links');

    from(keys)
      .pipe(
        concatMap((page) => this.store.enablePage(page)),
        last(),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Site setup complete', undefined, { duration: 3000 });
          this.router.navigate(['/dashboard']);
        },
        error: () => void 0,
      });
  }
}
