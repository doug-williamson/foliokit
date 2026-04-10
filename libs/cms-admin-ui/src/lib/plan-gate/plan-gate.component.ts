import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { PlanGatingService } from '@foliokit/cms-core';
import type { PlatformFeatures } from '@foliokit/cms-core';
import { PlanComparisonDialogComponent } from './plan-comparison-dialog.component';

/** TODO: deep-link to Stripe checkout URL once billing UI is wired. */
const UPGRADE_URL = '/settings';
const UPGRADE_FRAGMENT = 'billing';

@Component({
  selector: 'cms-plan-gate',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule],
  template: `
    @if (isEnabled()) {
      <ng-content />
    } @else {
      <div class="plan-gate-container">

        <!-- Blurred placeholder preview — aria-hidden, not interactive -->
        <div class="plan-gate-preview" aria-hidden="true">
          <div class="pg-mock">
            @for (_ of placeholderRows; track $index) {
              <div class="pg-mock-group">
                <div class="pg-mock-header">
                  <div class="pg-mock-bar pg-mock-bar--title"></div>
                  <div class="pg-mock-bar pg-mock-bar--meta"></div>
                </div>
                <div class="pg-mock-children">
                  <div class="pg-mock-child">
                    <div class="pg-mock-bar pg-mock-bar--child"></div>
                  </div>
                  <div class="pg-mock-child">
                    <div class="pg-mock-bar pg-mock-bar--child pg-mock-bar--short"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Upgrade CTA card — centered over the preview -->
        <div class="plan-gate-cta" role="region" aria-label="Feature requires upgrade">
          <span class="pg-plan-pill">{{ planLabel() }}</span>
          <h2 class="pg-heading">{{ featureLabel() }}</h2>
          <p class="pg-description">{{ featureDescription() }}</p>
          <p class="pg-price-note">
            Included in FolioKit {{ planLabel() }} — {{ planPrice() }}
          </p>
          <a
            mat-flat-button
            color="primary"
            [routerLink]="upgradeUrl"
            [fragment]="upgradeFragment"
          >
            Upgrade to {{ planLabel() }}
          </a>
          <button class="pg-compare-link" type="button" (click)="openComparison()">
            See what's included →
          </button>
        </div>

      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      min-height: 0;
    }

    /* ── Outer container — relative so the absolute overlay doesn't escape ── */

    .plan-gate-container {
      position: relative;
      flex: 1;
      min-height: 320px;
      overflow: hidden;
      border-radius: var(--r-lg);
    }

    /* ── Preview layer: stripe texture + blur ───────────────────────────────── */

    .plan-gate-preview {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
      overflow: hidden;
      background-image: repeating-linear-gradient(
        45deg,
        color-mix(in srgb, var(--text-muted) 18%, transparent) 0,
        color-mix(in srgb, var(--text-muted) 18%, transparent) 1px,
        transparent 0,
        transparent 7px
      );
    }

    .pg-mock {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      filter: blur(2px);
    }

    .pg-mock-group {
      background: var(--surface-1);
      border-radius: var(--r-lg);
      border: 1px solid var(--border);
      overflow: hidden;
    }

    .pg-mock-header {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-2);
    }

    .pg-mock-bar {
      border-radius: var(--r-sm);
      background: var(--surface-3);
      height: 10px;
    }

    .pg-mock-bar--title { width: 36%; }
    .pg-mock-bar--meta  { width: 14%; opacity: 0.6; }
    .pg-mock-bar--child { width: 54%; }
    .pg-mock-bar--short { width: 34%; }

    .pg-mock-children {
      padding: 10px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .pg-mock-child {
      padding-left: 20px;
    }

    /* ── CTA card — centred via absolute + transform ─────────────────────────── */

    .plan-gate-cta {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 2;
      background: var(--surface-0);
      border-radius: var(--r-xl);
      border: 0.5px solid var(--border-strong);
      padding: 24px 28px;
      max-width: 360px;
      width: calc(100% - 48px);
      text-align: center;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .pg-plan-pill {
      display: inline-block;
      background: var(--teal-100);
      color: var(--teal-700);
      font-size: 11px;
      font-weight: 500;
      font-family: var(--font-mono);
      letter-spacing: 0.05em;
      padding: 3px 10px;
      border-radius: 100px;
      margin-bottom: 12px;
    }

    [data-theme="dark"] .pg-plan-pill {
      background: color-mix(in srgb, var(--teal-500) 22%, transparent);
      color: var(--teal-200);
    }

    .pg-heading {
      font-size: 17px;
      font-weight: 500;
      font-family: var(--font-body);
      color: var(--text-primary);
      margin: 0 0 8px;
    }

    .pg-description {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0 0 8px;
    }

    .pg-price-note {
      font-size: 12px;
      color: var(--text-muted);
      margin: 0 0 20px;
    }

    .pg-compare-link {
      margin-top: 12px;
      background: none;
      border: none;
      font-size: 12px;
      color: var(--text-accent);
      cursor: pointer;
      font-family: var(--font-body);
      padding: 0;

      &:hover {
        text-decoration: underline;
      }

      &:focus-visible {
        outline: 2px solid var(--focus-border);
        outline-offset: 2px;
        border-radius: var(--r-sm);
      }
    }
  `],
})
export class PlanGateComponent {
  /** The PlatformFeatures key to gate on (e.g. 'taxonomy', 'analytics'). */
  readonly feature = input.required<keyof PlatformFeatures>();
  /** Minimum plan required to access this feature. */
  readonly requiredPlan = input.required<'pro' | 'agency'>();
  /** Short display name shown in the upgrade card heading. */
  readonly featureLabel = input.required<string>();
  /** One-sentence description shown below the heading. */
  readonly featureDescription = input.required<string>();

  private readonly planGatingService = inject(PlanGatingService);
  private readonly dialog = inject(MatDialog);

  protected readonly isEnabled = computed(
    () => this.planGatingService.features().platform[this.feature()],
  );
  protected readonly planLabel = computed(() =>
    this.requiredPlan() === 'pro' ? 'Pro' : 'Agency',
  );
  protected readonly planPrice = computed(() =>
    this.requiredPlan() === 'pro' ? '$9/mo' : '$29/mo',
  );

  protected readonly upgradeUrl = UPGRADE_URL;
  protected readonly upgradeFragment = UPGRADE_FRAGMENT;

  /** Three placeholder rows — enough to imply a real list UI behind the overlay. */
  protected readonly placeholderRows = [0, 1, 2] as const;

  protected openComparison(): void {
    this.dialog.open(PlanComparisonDialogComponent, {
      maxWidth: '480px',
      width: '90vw',
    });
  }
}
