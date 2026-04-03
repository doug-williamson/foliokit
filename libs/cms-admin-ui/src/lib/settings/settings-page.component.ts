import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { doc, getDoc } from 'firebase/firestore';
import { AuthService, FIRESTORE, SITE_ID, getPlanFeatures } from '@foliokit/cms-core';
import type { BillingRecord, BillingStatus, TenantConfig } from '@foliokit/cms-core';
import { FUNCTIONS_BASE_URL } from '../provide-admin-kit';

@Component({
  selector: 'folio-settings-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, DatePipe, FormsModule],
  template: `
    <div class="settings-page">
      <header class="page-header">
        <h1 class="page-title">Settings</h1>
      </header>

      @if (loadState() === 'loading') {
        <div class="load-state">Loading billing info…</div>
      } @else if (loadState() === 'error') {
        <div class="load-state load-state--error">Failed to load billing information.</div>
      } @else {
        @let record = billingRecord();
        <section class="billing-section">
          <h2 class="section-title">Plan &amp; Billing</h2>

          <div class="plan-summary">
            <div class="badge-row">
              <span class="badge badge--plan badge--{{ record?.plan }}">
                {{ planLabel(record?.plan) }}
              </span>
              <span class="badge badge--status badge--{{ record?.status }}">
                {{ statusLabel(record?.status) }}
              </span>
            </div>

            @if (record?.status === 'trialing' && trialEndsDate()) {
              <p class="billing-note">Trial ends {{ trialEndsDate() | date:'MMM d, yyyy' }}</p>
            }
            @if (record?.status === 'active') {
              <p class="billing-note">Renews {{ periodEndsDate() | date:'MMM d, yyyy' }}</p>
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

          @if (record?.plan === 'starter') {
            <div class="upgrade-card" id="upgrade-cta">
              <h3 class="upgrade-title">Upgrade to Pro</h3>
              <p class="upgrade-body">
                Add a custom domain, unlock all page types, and publish without limits.
              </p>
              <p class="upgrade-price">$9 / month</p>
              <button
                mat-flat-button
                color="primary"
                (click)="upgradeToPro()"
                [disabled]="checkoutState() === 'redirecting'"
              >
                {{ checkoutState() === 'redirecting' ? 'Redirecting to checkout…' : 'Upgrade to Pro' }}
              </button>
            </div>
          }

          @if (record?.plan === 'pro' || record?.plan === 'agency') {
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

        @if (features().customDomain) {
          <section class="settings-section">
            <h2 class="settings-section-title">Custom Domain</h2>
            <p class="settings-section-body">
              Point your own domain to your FolioKit site. Enter your domain below to get DNS setup instructions.
            </p>

            <div class="domain-input-row">
              <input
                class="domain-input"
                type="text"
                placeholder="www.yourdomain.com"
                [value]="domainInput()"
                (input)="domainInput.set($any($event.target).value)"
              />
              <button
                mat-flat-button
                color="primary"
                (click)="saveDomain()"
                [disabled]="domainSaveState() === 'saving' || !domainInput()"
              >
                {{ domainSaveState() === 'saving' ? 'Saving…' : domainSaveState() === 'saved' ? 'Saved ✓' : 'Save' }}
              </button>
            </div>

            @if (domainError()) {
              <p class="domain-error">{{ domainError() }}</p>
            }

            @if (cnameInstructions()) {
              <div class="dns-instructions">
                <h3 class="dns-title">DNS Configuration</h3>
                <p class="dns-body">Add the following record to your DNS provider:</p>
                <table class="dns-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Name</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>{{ cnameInstructions()!.type }}</code></td>
                      <td><code>{{ cnameInstructions()!.name }}</code></td>
                      <td><code class="dns-value">{{ cnameInstructions()!.value }}</code></td>
                    </tr>
                  </tbody>
                </table>
                @if (apexNote()) {
                  <p class="dns-apex-note">⚠ {{ apexNote() }}</p>
                }

                <div class="verify-row">
                  <button
                    mat-stroked-button
                    (click)="verifyDomain()"
                    [disabled]="domainVerifyState() === 'verifying'"
                  >
                    {{ domainVerifyState() === 'verifying' ? 'Checking…' : 'Verify DNS' }}
                  </button>

                  @if (domainVerifyState() === 'verified') {
                    <span class="verify-status verify-status--verified">✓ Domain verified</span>
                  }
                  @if (domainVerifyState() === 'pending') {
                    <span class="verify-status verify-status--pending">DNS propagating — check back in a few hours</span>
                  }
                  @if (domainVerifyState() === 'wrong_target') {
                    <span class="verify-status verify-status--error">CNAME points to wrong target. Expected: foliokit-blog--foliokit-6f974.us-central1.hosted.app</span>
                  }
                  @if (domainVerifyState() === 'error') {
                    <span class="verify-status verify-status--error">Could not verify DNS records</span>
                  }
                </div>

                @if (domainVerifyState() === 'verified') {
                  <div class="registration-note">
                    <p>Your DNS is configured correctly. To complete setup, contact FolioKit support or check your admin panel — manual domain registration is required to activate SSL.</p>
                  </div>
                }
              </div>
            }

            @if (customDomain() && !cnameInstructions()) {
              <div class="current-domain-row">
                <span class="current-domain-label">Current domain:</span>
                <code class="current-domain-value">{{ customDomain() }}</code>
                <button mat-stroked-button (click)="verifyDomain()" [disabled]="domainVerifyState() === 'verifying'">
                  {{ domainVerifyState() === 'verifying' ? 'Checking…' : 'Verify DNS' }}
                </button>
                @if (domainVerifyState() === 'verified') {
                  <span class="verify-status verify-status--verified">✓ Verified</span>
                }
                @if (domainVerifyState() === 'pending') {
                  <span class="verify-status verify-status--pending">Pending propagation</span>
                }
                @if (domainVerifyState() === 'wrong_target') {
                  <span class="verify-status verify-status--error">Wrong CNAME target</span>
                }
              </div>
            }
          </section>
        } @else {
          <section class="settings-section settings-section--gated">
            <h2 class="settings-section-title">Custom Domain <span class="pro-badge">Pro</span></h2>
            <p class="settings-section-body">
              Point your own domain to your FolioKit site.
            </p>
            <button mat-stroked-button color="primary" (click)="scrollToUpgrade()">
              Upgrade to Pro to unlock
            </button>
          </section>
        }

        @if (features().removeBranding) {
          <section class="settings-section">
            <h2 class="settings-section-title">Branding</h2>
            <p class="settings-section-body">
              Upload a custom logo to replace the FolioKit mark in your site header.
            </p>
            <p class="settings-section-hint">Logo upload coming soon.</p>
          </section>
        } @else {
          <section class="settings-section settings-section--gated">
            <h2 class="settings-section-title">Branding <span class="pro-badge">Pro</span></h2>
            <p class="settings-section-body">
              Replace the FolioKit header mark with your own logo.
            </p>
            <button mat-stroked-button color="primary" (click)="scrollToUpgrade()">
              Upgrade to Pro to unlock
            </button>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 640px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .load-state {
      color: var(--text-muted);
      padding: 2rem 0;
    }

    .load-state--error {
      color: #d32f2f;
    }

    .billing-section {
      background: var(--surface-1);
      border: 1px solid var(--border);
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
      padding: 0.2rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: var(--font-body);
      letter-spacing: 0.01em;
    }

    .badge--plan.badge--starter { background: var(--surface-2); color: var(--text-muted); }
    .badge--plan.badge--pro     { background: #e8f0fe; color: #1a56db; }
    .badge--plan.badge--agency  { background: #fef3c7; color: #92400e; }

    .badge--status.badge--trialing  { background: #fef3c7; color: #92400e; }
    .badge--status.badge--active    { background: #dcfce7; color: #166534; }
    .badge--status.badge--past_due  { background: #fee2e2; color: #991b1b; }
    .badge--status.badge--canceled  { background: var(--surface-2); color: var(--text-muted); }

    .billing-note {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
    }

    .warning-banner {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: #664d03;
    }

    .upgrade-card {
      border-top: 1px solid var(--border);
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
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
    }

    .settings-section {
      padding: 24px 0;
      border-top: 1px solid var(--border);
    }

    .settings-section--gated {
      opacity: 0.75;
    }

    .settings-section-title {
      font-family: var(--font-body);
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .settings-section-body {
      color: var(--text-muted);
      font-size: 0.875rem;
      margin-bottom: 16px;
    }

    .settings-section-hint {
      color: var(--text-muted);
      font-size: 0.8rem;
      font-style: italic;
    }

    .pro-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-accent);
      border: 1px solid var(--text-accent);
      border-radius: 4px;
      padding: 1px 6px;
      font-family: var(--font-mono);
    }

    .domain-input-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .domain-input {
      flex: 1;
      height: 36px;
      padding: 0 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface-0);
      color: var(--text-primary);
      font-family: var(--font-mono);
      font-size: 0.875rem;

      &:focus {
        outline: none;
        border-color: var(--text-accent);
      }
    }

    .domain-error {
      color: #d32f2f;
      font-size: 0.8rem;
      margin: 0 0 0.75rem;
    }

    .dns-instructions {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem;
      margin-top: 1rem;
    }

    .dns-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem;
    }

    .dns-body {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0 0 1rem;
    }

    .dns-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      margin-bottom: 0.75rem;

      th {
        text-align: left;
        font-family: var(--font-mono);
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        padding: 0.4rem 0.75rem;
        border-bottom: 1px solid var(--border);
      }

      td {
        padding: 0.6rem 0.75rem;
        color: var(--text-primary);
        border-bottom: 1px solid var(--border);
      }
    }

    .dns-value {
      font-size: 0.75rem;
      word-break: break-all;
    }

    .dns-apex-note {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0.5rem 0 0;
      line-height: 1.5;
    }

    .verify-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
    }

    .verify-status {
      font-size: 0.8rem;
    }

    .verify-status--verified { color: #166534; }
    .verify-status--pending  { color: #92400e; }
    .verify-status--error    { color: #991b1b; }

    .registration-note {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: #e8f0fe;
      border-radius: 6px;
      font-size: 0.8rem;
      color: #1a56db;
      line-height: 1.5;
    }

    .current-domain-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
    }

    .current-domain-label {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .current-domain-value {
      font-family: var(--font-mono);
      font-size: 0.875rem;
      color: var(--text-primary);
    }
  `],
})
export class SettingsPageComponent implements OnInit {
  private readonly firestore = inject(FIRESTORE);
  private readonly siteId = inject(SITE_ID);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly functionsBaseUrl = inject(FUNCTIONS_BASE_URL);

  readonly billingRecord = signal<BillingRecord | null>(null);
  readonly loadState = signal<'loading' | 'loaded' | 'error'>('loading');
  readonly checkoutState = signal<'idle' | 'redirecting'>('idle');
  readonly portalState = signal<'idle' | 'redirecting'>('idle');

  readonly customDomain = signal<string | null>(null);
  readonly customDomainStatus = signal<'unregistered' | 'registration_pending' | 'active' | 'failed' | null>(null);
  readonly domainInput = signal<string>('');
  readonly domainSaveState = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  readonly domainVerifyState = signal<'idle' | 'verifying' | 'verified' | 'pending' | 'wrong_target' | 'error'>('idle');
  readonly cnameInstructions = signal<{ type: string; name: string; value: string } | null>(null);
  readonly apexNote = signal<string | null>(null);
  readonly domainError = signal<string | null>(null);

  readonly trialEndsDate = computed(() => this.billingRecord()?.trialEndsAt?.toDate() ?? null);
  readonly periodEndsDate = computed(() => this.billingRecord()?.currentPeriodEndsAt?.toDate() ?? null);

  protected readonly features = computed(() =>
    getPlanFeatures(this.billingRecord()?.plan ?? 'starter'),
  );

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.firestore) return;
    try {
      const snap = await getDoc(doc(this.firestore, 'billing', this.siteId));
      if (snap.exists()) {
        this.billingRecord.set(snap.data() as BillingRecord);
      }
      this.loadState.set('loaded');
    } catch {
      this.loadState.set('error');
    }

    try {
      const tenantSnap = await getDoc(doc(this.firestore, 'tenants', this.siteId));
      if (tenantSnap.exists()) {
        const tenantData = tenantSnap.data() as TenantConfig;
        this.customDomain.set(tenantData.customDomain ?? null);
        this.customDomainStatus.set(tenantData.customDomainStatus ?? null);
        if (tenantData.customDomain) {
          this.domainInput.set(tenantData.customDomain);
        }
      }
    } catch (err) {
      console.error('SettingsPageComponent: failed to load tenant doc', err);
    }
  }

  protected scrollToUpgrade(): void {
    document.getElementById('upgrade-cta')?.scrollIntoView({ behavior: 'smooth' });
  }

  protected planLabel(plan: string | undefined): string {
    const labels: Record<string, string> = {
      starter: 'Starter',
      pro: 'Pro',
      agency: 'Agency',
    };
    return labels[plan ?? ''] ?? (plan ?? '');
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
    const idToken = await this.auth.user()?.getIdToken();
    if (!idToken) return;
    this.checkoutState.set('redirecting');
    try {
      const res = await fetch(`${this.functionsBaseUrl}/createCheckoutSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ tenantId: this.siteId, plan: 'pro' }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
      else this.checkoutState.set('idle');
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
          'Authorization': `Bearer ${idToken}`,
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

  protected async saveDomain(): Promise<void> {
    if (!this.domainInput()) return;
    this.domainSaveState.set('saving');
    this.domainError.set(null);
    const idToken = await this.auth.user()?.getIdToken();
    if (!idToken) {
      this.domainSaveState.set('error');
      this.domainError.set('Failed to save domain. Please try again.');
      return;
    }
    try {
      const res = await fetch(`${this.functionsBaseUrl}/setCustomDomain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ tenantId: this.siteId, domain: this.domainInput() }),
      });
      const data = (await res.json()) as {
        domain?: string;
        cname?: { type: string; name: string; value: string };
        apexNote?: string;
        error?: string;
      };
      if (res.ok && data.domain) {
        this.customDomain.set(data.domain);
        this.cnameInstructions.set(data.cname ?? null);
        this.apexNote.set(data.apexNote ?? null);
        this.domainSaveState.set('saved');
        this.domainVerifyState.set('idle');
        setTimeout(() => this.domainSaveState.set('idle'), 3000);
      } else if (res.status === 403 && data.error === 'plan_upgrade_required') {
        this.domainError.set('Your plan does not support custom domains.');
        this.domainSaveState.set('error');
      } else if (res.status === 400 && data.error === 'reserved_domain') {
        this.domainError.set('That domain is reserved and cannot be used.');
        this.domainSaveState.set('error');
      } else {
        this.domainError.set('Failed to save domain. Please try again.');
        this.domainSaveState.set('error');
      }
    } catch {
      this.domainError.set('Failed to save domain. Please try again.');
      this.domainSaveState.set('error');
    }
  }

  protected async verifyDomain(): Promise<void> {
    if (!this.customDomain()) return;
    this.domainVerifyState.set('verifying');
    const idToken = await this.auth.user()?.getIdToken();
    if (!idToken) {
      this.domainVerifyState.set('error');
      return;
    }
    try {
      const res = await fetch(
        `${this.functionsBaseUrl}/verifyCustomDomain?tenantId=${encodeURIComponent(this.siteId)}`,
        { headers: { 'Authorization': `Bearer ${idToken}` } },
      );
      const data = (await res.json()) as { status?: string };
      switch (data.status) {
        case 'verified':     this.domainVerifyState.set('verified');     break;
        case 'pending':      this.domainVerifyState.set('pending');      break;
        case 'wrong_target': this.domainVerifyState.set('wrong_target'); break;
        default:             this.domainVerifyState.set('error');
      }
    } catch {
      this.domainVerifyState.set('error');
    }
  }
}
