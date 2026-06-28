import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { from, last } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import {
  RhombusButtonComponent,
  RhombusCheckboxComponent,
  RhombusTagComponent,
  RhombusToastService,
} from '@rhombuskit/core';
import { SiteConfigNavStore, type EnablePageKey } from '../stores/site-config-nav.store';

@Component({
  selector: 'admin-setup-prompt',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusButtonComponent, RhombusCheckboxComponent, RhombusTagComponent],
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

      .page-row rhombus-checkbox {
        flex: 1;
        min-width: 0;
      }

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
            <div class="page-row">
              <rhombus-checkbox label="Home page" [checked]="true" [disabled]="true" />
              <rhombus-tag size="sm">Required</rhombus-tag>
            </div>
            <div class="page-row">
              <rhombus-checkbox label="Blog page" [checked]="true" [disabled]="true" />
              <rhombus-tag size="sm">Required</rhombus-tag>
            </div>
            <div class="page-row">
              <rhombus-checkbox label="About page" [control]="aboutControl" />
            </div>
            <div class="page-row">
              <rhombus-checkbox label="Links page" [control]="linksControl" />
            </div>
          </div>

          <rhombus-button
            class="save-btn"
            (click)="save()"
            [disabled]="isSaving()"
          >
            Save and continue
          </rhombus-button>
        </div>
      </div>
    }
  `,
})
export class SetupPromptComponent {
  private readonly store = inject(SiteConfigNavStore);
  private readonly router = inject(Router);
  private readonly toast = inject(RhombusToastService);

  readonly aboutControl = new FormControl(false, { nonNullable: true });
  readonly linksControl = new FormControl(false, { nonNullable: true });
  readonly isSaving = this.store.isSaving;

  readonly hasIncompleteItems = computed(() => {
    if (!this.store.isLoaded()) return false;
    return !this.store.config()?.onboardingComplete;
  });

  save(): void {
    const keys: EnablePageKey[] = ['home', 'blog'];
    if (this.aboutControl.value) keys.push('about');
    if (this.linksControl.value) keys.push('links');

    from(keys)
      .pipe(
        concatMap((page) => this.store.enablePage(page)),
        last(),
      )
      .subscribe({
        next: () => {
          this.toast.success('Site setup complete', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        },
        error: () => void 0,
      });
  }
}
