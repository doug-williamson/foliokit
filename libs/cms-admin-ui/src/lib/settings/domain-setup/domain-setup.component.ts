import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { AuthService, FIRESTORE, SITE_ID } from '@foliokit/cms-core';
import type { TenantConfig } from '@foliokit/cms-core';
import { FUNCTIONS_BASE_URL } from '../../provide-admin-kit';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/confirm-dialog/confirm-dialog.component';

const CNAME_TARGET = 'foliokit-blog--foliokit-6f974.us-central1.hosted.app';
const DOMAIN_RE = /^(www\.)?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/i;

type Step = 'enter' | 'dns_pending' | 'active';
type VerifyState = 'idle' | 'checking' | 'pending' | 'wrong_target' | 'error';

@Component({
  selector: 'cms-domain-setup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (!loaded()) {
      <div class="ds-skeleton">
        <div class="skeleton-line skeleton-line--wide"></div>
        <div class="skeleton-line"></div>
      </div>
    } @else if (step() === 'enter') {
      <div class="ds-enter">
        <div class="ds-input-row">
          <input
            class="ds-input"
            type="text"
            placeholder="www.yourdomain.com"
            [value]="domainInput()"
            (input)="domainInput.set($any($event.target).value)"
            (keydown.enter)="submitDomain()"
          />
          <button
            mat-flat-button
            color="primary"
            (click)="submitDomain()"
            [disabled]="submitting() || !domainInput().trim()"
          >
            {{ submitting() ? 'Saving…' : 'Get DNS instructions' }}
          </button>
        </div>
        @if (domainError()) {
          <p class="ds-error">{{ domainError() }}</p>
        }
      </div>
    } @else if (step() === 'dns_pending') {
      <div class="ds-pending">
        <div class="ds-domain-row">
          <code class="ds-domain">{{ domain() }}</code>
          <span class="ds-chip ds-chip--pending">Pending DNS</span>
        </div>

        <div class="ds-dns-card">
          <p class="ds-dns-intro">Add this record at your DNS provider:</p>
          <table class="ds-dns-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>CNAME</code></td>
                <td><code>{{ cnameHostname() }}</code></td>
                <td class="ds-dns-value-cell">
                  <code class="ds-dns-value">{{ cnameTarget }}</code>
                </td>
                <td>
                  <button
                    mat-icon-button
                    class="ds-copy-btn"
                    [attr.aria-label]="copiedField() === 'cname' ? 'Copied' : 'Copy CNAME value'"
                    (click)="copyToClipboard()"
                  >
                    <mat-icon
                      [svgIcon]="copiedField() === 'cname' ? 'check_circle' : 'content_copy'"
                      [class.ds-copied-icon]="copiedField() === 'cname'"
                    />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          @if (apexNote()) {
            <p class="ds-apex-note">{{ apexNote() }}</p>
          }
        </div>

        <div class="ds-action-row">
          <button
            mat-flat-button
            color="primary"
            (click)="checkVerification()"
            [disabled]="verifyState() === 'checking'"
          >
            {{ verifyState() === 'checking' ? 'Checking DNS…' : 'Check DNS' }}
          </button>
          <button mat-button (click)="removeDomain()" class="ds-remove-btn">
            Remove domain
          </button>
        </div>
      </div>
    } @else {
      <div class="ds-active">
        <div class="ds-domain-row">
          <mat-icon svgIcon="check_circle" class="ds-active-icon" />
          <code class="ds-domain">{{ domain() }}</code>
          <span class="ds-chip ds-chip--active">Active</span>
        </div>
        <p class="ds-active-note">Your custom domain is live and serving your site.</p>
        <button mat-button (click)="removeDomain()" class="ds-remove-btn">
          Remove domain
        </button>
      </div>
    }
  `,
  styles: [`
    .ds-skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-line {
      height: 36px;
      background: var(--surface-2);
      border-radius: 6px;
      animation: ds-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-line--wide {
      width: 60%;
    }

    @keyframes ds-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .ds-input-row {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .ds-input {
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

    .ds-error {
      color: #d32f2f;
      font-size: 0.8rem;
      margin: 0.5rem 0 0;
    }

    .ds-domain-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .ds-domain {
      font-family: var(--font-mono);
      font-size: 0.9rem;
      color: var(--text-primary);
    }

    .ds-chip {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .ds-chip--active {
      background: #d1fae5;
      color: #065f46;
    }

    .ds-chip--pending {
      background: #fef3c7;
      color: #92400e;
    }

    .ds-dns-card {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
    }

    .ds-dns-intro {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0 0 0.75rem;
    }

    .ds-dns-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;

      th {
        text-align: left;
        font-family: var(--font-mono);
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        padding: 0.35rem 0.5rem;
        border-bottom: 1px solid var(--border);
      }

      td {
        padding: 0.5rem 0.5rem;
        color: var(--text-primary);
        vertical-align: middle;
      }
    }

    .ds-dns-value-cell {
      width: 100%;
    }

    .ds-dns-value {
      font-size: 0.75rem;
      word-break: break-all;
      color: var(--text-primary);
    }

    .ds-copy-btn {
      color: var(--text-muted);
      width: 32px !important;
      height: 32px !important;

      mat-icon {
        font-size: 18px !important;
        width: 18px !important;
        height: 18px !important;
      }
    }

    .ds-copied-icon {
      color: #166534 !important;
    }

    .ds-apex-note {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0.75rem 0 0;
      line-height: 1.5;
    }

    .ds-action-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .ds-remove-btn {
      color: var(--text-muted) !important;
      font-size: 0.8rem;
    }

    .ds-active-icon {
      color: #166534;
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
    }

    .ds-active-note {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0 0 0.75rem;
    }
  `],
})
export class DomainSetupComponent implements OnInit {
  private readonly firestore = inject(FIRESTORE);
  private readonly siteId = inject(SITE_ID);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly functionsBaseUrl = inject(FUNCTIONS_BASE_URL);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly step = signal<Step>('enter');
  readonly domain = signal<string | null>(null);
  readonly domainInput = signal('');
  readonly submitting = signal(false);
  readonly domainError = signal<string | null>(null);
  readonly verifyState = signal<VerifyState>('idle');
  readonly cnameHostname = signal('www');
  readonly apexNote = signal<string | null>(null);
  readonly copiedField = signal<'cname' | null>(null);
  readonly loaded = signal(false);

  protected readonly cnameTarget = CNAME_TARGET;

  async ngOnInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.firestore) {
      this.loaded.set(true);
      return;
    }
    try {
      const snap = await getDoc(doc(this.firestore, 'tenants', this.siteId));
      if (snap.exists()) {
        const data = snap.data() as TenantConfig;
        if (data.customDomain) {
          this.domain.set(data.customDomain);
          this.domainInput.set(data.customDomain);
          this.step.set(data.customDomainStatus === 'active' ? 'active' : 'dns_pending');
        }
      }
    } catch (err) {
      console.error('DomainSetupComponent: failed to load tenant', err);
    }
    this.loaded.set(true);
  }

  protected async submitDomain(): Promise<void> {
    const raw = this.domainInput().trim();
    if (!DOMAIN_RE.test(raw)) {
      this.domainError.set('Enter a valid domain (e.g. www.example.com).');
      return;
    }
    this.domainError.set(null);
    this.submitting.set(true);
    const idToken = await this.auth.user()?.getIdToken();
    if (!idToken) {
      this.submitting.set(false);
      this.domainError.set('Not signed in. Please refresh and try again.');
      return;
    }
    try {
      const res = await fetch(`${this.functionsBaseUrl}/setCustomDomain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ tenantId: this.siteId, domain: raw }),
      });
      const data = (await res.json()) as {
        domain?: string;
        cname?: { type: string; name: string; value: string };
        apexNote?: string;
        error?: string;
      };
      if (res.ok && data.domain) {
        this.domain.set(data.domain);
        this.cnameHostname.set(data.cname?.name ?? 'www');
        this.apexNote.set(data.apexNote ?? null);
        this.step.set('dns_pending');
        this.verifyState.set('idle');
      } else if (res.status === 403 && data.error === 'plan_upgrade_required') {
        this.domainError.set('Your plan does not support custom domains. Upgrade to Pro.');
      } else if (res.status === 400 && data.error === 'reserved_domain') {
        this.domainError.set('That domain is reserved and cannot be used.');
      } else {
        this.domainError.set('Failed to save domain. Please try again.');
      }
    } catch {
      this.domainError.set('Network error. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }

  protected async checkVerification(): Promise<void> {
    if (!this.domain()) return;
    this.verifyState.set('checking');
    const idToken = await this.auth.user()?.getIdToken();
    if (!idToken) {
      this.verifyState.set('error');
      return;
    }
    try {
      const res = await fetch(
        `${this.functionsBaseUrl}/verifyCustomDomain?tenantId=${encodeURIComponent(this.siteId)}`,
        { headers: { Authorization: `Bearer ${idToken}` } },
      );
      const data = (await res.json()) as { status?: string };
      switch (data.status) {
        case 'verified':
          this.verifyState.set('idle');
          this.step.set('active');
          break;
        case 'pending':
          this.verifyState.set('pending');
          this.snackBar.open('DNS is still propagating — check back in a few hours.', 'OK', {
            duration: 5000,
          });
          break;
        case 'wrong_target':
          this.verifyState.set('wrong_target');
          this.snackBar.open(
            `CNAME points to wrong target. Expected: ${CNAME_TARGET}`,
            'OK',
            { duration: 8000 },
          );
          break;
        default:
          this.verifyState.set('error');
          this.snackBar.open('Could not verify DNS records. Try again later.', 'OK', {
            duration: 5000,
          });
      }
    } catch {
      this.verifyState.set('error');
      this.snackBar.open('Network error. Please try again.', 'OK', { duration: 5000 });
    }
  }

  protected removeDomain(): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Remove custom domain?',
          message: `This will disconnect ${this.domain()} from your site. You can add a new domain at any time.`,
          confirmLabel: 'Remove',
          destructive: true,
        },
      },
    );
    ref.afterClosed().subscribe(async (confirmed) => {
      if (!confirmed || !this.firestore) return;
      try {
        await updateDoc(doc(this.firestore, 'tenants', this.siteId), {
          customDomain: null,
          customDomainStatus: null,
        });
        this.domain.set(null);
        this.domainInput.set('');
        this.step.set('enter');
        this.verifyState.set('idle');
        this.apexNote.set(null);
        this.cnameHostname.set('www');
        this.copiedField.set(null);
      } catch {
        this.snackBar.open('Failed to remove domain. Please try again.', 'OK', { duration: 5000 });
      }
    });
  }

  protected copyToClipboard(): void {
    navigator.clipboard.writeText(CNAME_TARGET).then(() => {
      this.copiedField.set('cname');
      setTimeout(() => this.copiedField.set(null), 2000);
    });
  }
}
