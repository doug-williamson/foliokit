import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AuthService, PlanGatingService, SITE_ID } from '@foliokit/cms-core';
import type { BillingStatus, PlanTier } from '@foliokit/cms-core';
import { FUNCTIONS_BASE_URL } from '../provide-admin-kit';
import { BillingCheckoutService } from '../services/billing-checkout.service';

@Component({
  selector: 'folio-settings-billing-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, DatePipe],
  template: `
    <div class="settings-billing-tab" id="billing">
      @let record = billingRecord();
      <section class="billing-section">
        <h2 class="section-title">Your Plan</h2>

        <div class="plan-summary">
          <div class="badge-row">
            <span class="badge admin-meta badge--plan badge--{{ effectivePlanTier() }}">
              {{ planLabel(effectivePlanTier()) }}
            </span>
            @if (record?.status) {
              <span class="badge admin-meta badge--status badge--{{ record!.status }}">
                {{ statusLabel(record!.status) }}
              </span>
            }
          </div>

          @if (record?.status === 'trialing' && trialEndsDate()) {
            <p class="billing-note">Trial ends {{ trialEndsDate() | date: 'MMM d, yyyy' }}</p>
          }
          @if (record?.status === 'active') {
            <p class="billing-note">Renews {{ periodEndsDate() | date: 'MMM d, yyyy' }}</p>
          }
          @if (record?.status === 'past_due') {
            <div class="warning-banner">
              Your payment is past due. Update your billing details to avoid service interruption.
            </div>
          }
          @if (record?.status === 'canceled') {
            <p class="billing-note">Your subscription has been canceled.</p>
          }
        </div>

        @if (effectivePlanTier() === 'starter') {
          <div class="upgrade-card" id="upgrade-cta">
            <h3 class="upgrade-title">Upgrade to Pro</h3>
            <p class="upgrade-body">
              Add a custom domain, unlock all page types, and publish without limits.
            </p>
            <p class="upgrade-price">$9 / month</p>
            <button
              mat-stroked-button
              color="primary"
              style="align-self: flex-start"
              (click)="upgradeToPro()"
              [disabled]="checkoutState() === 'redirecting'"
            >
              {{ checkoutState() === 'redirecting' ? 'Redirecting to checkout…' : 'Upgrade to Pro' }}
            </button>
          </div>
        }

        @if (effectivePlanTier() === 'pro' || effectivePlanTier() === 'agency') {
          <div class="manage-row">
            <button
              mat-stroked-button
              (click)="openBillingPortal()"
              [disabled]="portalState() === 'redirecting'"
            >
              {{ portalState() === 'redirecting' ? 'Opening billing portal…' : 'Manage Billing' }}
            </button>
          </div>
        }
      </section>

      <!-- GATE_TODO: customCss -->
    </div>
  `,
  styles: [
    `
      .settings-billing-tab {
        max-width: 640px;
        margin: 0 auto;
        padding: 1.5rem 1rem 2rem;
      }

      .billing-section {
        background: var(--surface-1);
        border: var(--border-width) solid var(--border);
        border-radius: 8px;
        padding: 1.5rem;
      }

      .section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0 0 1.25rem;
      }

      .plan-summary {
        margin-bottom: 1.5rem;
      }

      .badge-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.2rem 0.55rem;
        border-radius: var(--r-sm);
        border: var(--border-width) solid var(--border-strong);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.08em;
      }

      .badge--plan.badge--starter {
        background: color-mix(in srgb, var(--surface-2) 88%, transparent);
        color: var(--text-muted);
      }
      .badge--plan.badge--pro {
        background: color-mix(in srgb, var(--teal-100) 80%, transparent);
        color: var(--teal-700);
        border-color: color-mix(in srgb, var(--teal-500) 45%, var(--border-strong));
      }
      .badge--plan.badge--agency {
        background: color-mix(in srgb, var(--violet-100) 80%, transparent);
        color: var(--violet-600);
        border-color: color-mix(in srgb, var(--violet-600) 45%, var(--border-strong));
      }

      .badge--status.badge--trialing {
        background: color-mix(in srgb, var(--violet-100) 80%, transparent);
        color: var(--violet-600);
        border-color: color-mix(in srgb, var(--violet-600) 45%, var(--border-strong));
      }
      .badge--status.badge--active {
        background: color-mix(in srgb, var(--green-100) 84%, transparent);
        color: var(--green-700);
        border-color: color-mix(in srgb, var(--green-700) 45%, var(--border-strong));
      }
      .badge--status.badge--past_due {
        background: color-mix(in srgb, var(--red-100) 84%, transparent);
        color: var(--red-700);
        border-color: color-mix(in srgb, var(--red-700) 45%, var(--border-strong));
      }
      .badge--status.badge--canceled {
        background: color-mix(in srgb, var(--surface-2) 88%, transparent);
        color: var(--text-muted);
      }

      .billing-note {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin: 0;
      }

      .warning-banner {
        background: color-mix(in srgb, var(--red-100) 68%, transparent);
        border: var(--border-width) solid color-mix(in srgb, var(--red-600) 35%, var(--border-strong));
        border-radius: var(--r-md);
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: var(--red-700);
      }

      .upgrade-card {
        border-top: var(--border-width) solid var(--border);
        padding-top: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .upgrade-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }

      .upgrade-body {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin: 0;
      }

      .upgrade-price {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0.25rem 0;
      }

      .manage-row {
        border-top: var(--border-width) solid var(--border);
        padding-top: 1.5rem;
      }
    `,
  ],
})
export class SettingsBillingTabComponent {
  private readonly planGating = inject(PlanGatingService);
  private readonly siteId = inject(SITE_ID);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly functionsBaseUrl = inject(FUNCTIONS_BASE_URL);
  private readonly billingCheckout = inject(BillingCheckoutService);

  readonly billingRecord = this.planGating.billingRecord;
  readonly features = this.planGating.features;

  readonly checkoutState = signal<'idle' | 'redirecting'>('idle');
  readonly portalState = signal<'idle' | 'redirecting'>('idle');

  readonly effectivePlanTier = this.planGating.plan;

  readonly trialEndsDate = computed(() => this.billingRecord()?.trialEndsAt?.toDate() ?? null);
  readonly periodEndsDate = computed(() => this.billingRecord()?.currentPeriodEndsAt?.toDate() ?? null);

  protected planLabel(plan: PlanTier): string {
    const labels: Record<PlanTier, string> = {
      starter: 'Starter',
      pro: 'Pro',
      agency: 'Agency',
      agency_internal: 'Agency (Internal)',
    };
    return labels[plan];
  }

  protected statusLabel(status: BillingStatus | undefined): string {
    const labels: Record<BillingStatus, string> = {
      trialing: 'Trialing',
      active: 'Active',
      past_due: 'Past Due',
      canceled: 'Canceled',
    };
    return status ? labels[status] : '';
  }

  protected async upgradeToPro(): Promise<void> {
    this.checkoutState.set('redirecting');
    try {
      const url = await this.billingCheckout.createCheckoutSession('pro');
      if (isPlatformBrowser(this.platformId)) {
        window.location.href = url;
      }
    } catch {
      this.checkoutState.set('idle');
    }
  }

  protected async openBillingPortal(): Promise<void> {
    const idToken = await this.auth.user()?.getIdToken();
    if (!idToken) return;
    this.portalState.set('redirecting');
    try {
      const res = await fetch(`${this.functionsBaseUrl}/createBillingPortalSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ tenantId: this.siteId }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
      else this.portalState.set('idle');
    } catch {
      this.portalState.set('idle');
    }
  }
}
