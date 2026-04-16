import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE, SITE_ID, getPlanFeatures } from '@foliokit/cms-core';
import type { BillingRecord } from '@foliokit/cms-core';
import { DomainSetupComponent } from './domain-setup/domain-setup.component';

@Component({
  selector: 'folio-settings-domain-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, DomainSetupComponent],
  template: `
    <div class="settings-domain-tab">
      @if (loadState() === 'loading') {
        <div class="load-state">Loading billing info…</div>
      } @else if (loadState() === 'error') {
        <div class="load-state load-state--error">
          <p class="load-state-error-text">
            Could not load billing information. Check your connection and try again. If this keeps
            happening, you may not have permission to read billing for this site.
          </p>
          <button mat-stroked-button type="button" (click)="retryLoad()">Try again</button>
        </div>
      } @else {
        @if (features().customDomain) {
          <section class="settings-section">
            <h2 class="settings-section-title">Custom Domain</h2>
            <p class="settings-section-body">
              Point your own domain to your FolioKit site. Enter your domain below to get DNS setup
              instructions.
            </p>
            <cms-domain-setup />
          </section>
        } @else {
          <section class="settings-section settings-section--gated">
            <h2 class="settings-section-title">Custom Domain <span class="pro-badge">Pro</span></h2>
            <p class="settings-section-body">Point your own domain to your FolioKit site.</p>
            <button mat-stroked-button color="primary" (click)="scrollToUpgrade()">
              Upgrade to Pro to unlock
            </button>
          </section>
        }
      }
    </div>
  `,
  styles: [
    `
      .settings-domain-tab {
        max-width: 640px;
        margin: 0 auto;
        padding: 1.5rem 1rem 2rem;
      }

      .load-state {
        color: var(--text-muted);
        padding: 2rem 0;
      }

      .load-state--error {
        color: #d32f2f;
      }

      .load-state-error-text {
        margin: 0 0 12px;
        max-width: 36rem;
      }

      .settings-section {
        padding: 24px 0;
        border-top: var(--border-width) solid var(--border);
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

      .pro-badge {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-accent);
        border: var(--border-width) solid var(--text-accent);
        border-radius: 4px;
        padding: 1px 6px;
        font-family: var(--font-mono);
      }
    `,
  ],
})
export class SettingsDomainTabComponent implements OnInit {
  private readonly firestore = inject(FIRESTORE);
  private readonly siteId = inject(SITE_ID);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly billingRecord = signal<BillingRecord | null>(null);
  readonly loadState = signal<'loading' | 'loaded' | 'error'>('loading');

  protected readonly features = computed(() =>
    getPlanFeatures(this.billingRecord()?.plan ?? 'starter'),
  );

  ngOnInit(): void {
    void this.loadBilling();
  }

  protected retryLoad(): void {
    void this.loadBilling();
  }

  private async loadBilling(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.firestore) return;
    this.loadState.set('loading');
    try {
      const snap = await getDoc(doc(this.firestore, 'billing', this.siteId));
      if (snap.exists()) {
        this.billingRecord.set(snap.data() as BillingRecord);
      } else {
        this.billingRecord.set(null);
      }
      this.loadState.set('loaded');
    } catch {
      this.loadState.set('error');
    }
  }

  protected scrollToUpgrade(): void {
    void this.router.navigate([], { relativeTo: this.route, fragment: 'billing' });
  }
}
