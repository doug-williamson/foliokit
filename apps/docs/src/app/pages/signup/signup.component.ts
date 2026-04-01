import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import type { SignupFormValue, SubdomainAvailability, ProvisionResult } from '@foliokit/cms-core';

function cfUrl(name: string): string {
  const pid = environment.firebase.projectId;
  return environment.isProd
    ? `https://us-central1-${pid}.cloudfunctions.net/${name}`
    : `http://localhost:5001/${pid}/us-central1/${name}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

@Component({
  selector: 'docs-signup-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  styles: [`
    :host {
      display: block;
      min-height: 80vh;
      background: linear-gradient(160deg, var(--mat-sys-surface-container-lowest) 0%, var(--mat-sys-surface-container) 100%);
      padding: 4rem 1.5rem;
    }
    .signup-container {
      max-width: 480px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--mat-sys-primary);
      margin: 0 0 0.5rem;
    }
    .subtitle {
      color: var(--mat-sys-on-surface-variant);
      margin: 0 0 2rem;
      font-size: 1rem;
      line-height: 1.5;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--mat-sys-on-surface);
      margin-bottom: 0.375rem;
    }
    input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      font-size: 0.9375rem;
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      outline: none;
      transition: border-color 0.15s;
      box-sizing: border-box;
    }
    input:focus {
      border-color: var(--mat-sys-primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--mat-sys-primary) 20%, transparent);
    }
    input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .subdomain-input-row {
      display: flex;
      align-items: center;
      gap: 0;
    }
    .subdomain-input-row input {
      border-radius: 8px 0 0 8px;
      flex: 1;
    }
    .subdomain-suffix {
      padding: 0.625rem 0.75rem;
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
      background: var(--mat-sys-surface-container);
      border: 1px solid var(--mat-sys-outline-variant);
      border-left: none;
      border-radius: 0 8px 8px 0;
      white-space: nowrap;
      user-select: none;
    }
    .availability-status {
      font-size: 0.8125rem;
      margin-top: 0.375rem;
      min-height: 1.25rem;
    }
    .status-checking { color: var(--mat-sys-on-surface-variant); }
    .status-available { color: var(--mat-sys-tertiary, #00897b); }
    .status-taken, .status-invalid, .status-reserved { color: var(--mat-sys-error); }
    .status-error { color: var(--mat-sys-on-surface-variant); }
    .submit-btn {
      width: 100%;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      cursor: pointer;
      transition: opacity 0.15s;
      margin-top: 0.5rem;
    }
    .submit-btn:hover:not(:disabled) {
      opacity: 0.9;
    }
    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .error-message {
      color: var(--mat-sys-error);
      font-size: 0.875rem;
      margin-top: 1rem;
      text-align: center;
    }
    .success-container {
      text-align: center;
      padding: 2rem 0;
    }
    .success-container h1 {
      margin-bottom: 1rem;
    }
    .blog-link {
      display: inline-block;
      font-size: 1.125rem;
      color: var(--mat-sys-primary);
      text-decoration: none;
      font-weight: 500;
      margin-bottom: 1.5rem;
    }
    .blog-link:hover {
      text-decoration: underline;
    }
    .success-body {
      color: var(--mat-sys-on-surface-variant);
      font-size: 0.9375rem;
      line-height: 1.6;
      margin: 0;
    }
  `],
  template: `
    <div class="signup-container">
      @if (submitState() === 'success') {
        <div class="success-container">
          <h1>Your site is ready</h1>
          <a class="blog-link" [href]="provisionResult()!.blogUrl" target="_blank" rel="noopener noreferrer">
            {{ provisionResult()!.blogUrl }}
          </a>
          <p class="success-body">
            Check your email for a sign-in link to your admin dashboard.
            It may take a minute to arrive.
          </p>
        </div>
      } @else {
        <h1>Get Started</h1>
        <p class="subtitle">Create your FolioKit site in seconds.</p>

        <div class="form-group">
          <label for="displayName">Display name</label>
          <input
            id="displayName"
            type="text"
            placeholder="Jane Doe"
            [ngModel]="formValue().displayName"
            (ngModelChange)="updateField('displayName', $event)"
            [disabled]="submitState() === 'submitting'"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            [ngModel]="formValue().email"
            (ngModelChange)="updateField('email', $event)"
            [disabled]="submitState() === 'submitting'"
          />
        </div>

        <div class="form-group">
          <label for="subdomain">Subdomain</label>
          <div class="subdomain-input-row">
            <input
              id="subdomain"
              type="text"
              placeholder="mysite"
              [ngModel]="formValue().subdomain"
              (ngModelChange)="onSubdomainChange($event)"
              [disabled]="submitState() === 'submitting'"
            />
            <span class="subdomain-suffix">.foliokitcms.com</span>
          </div>
          <div class="availability-status">
            @switch (subdomainAvailability().status) {
              @case ('checking') {
                <span class="status-checking">Checking availability…</span>
              }
              @case ('available') {
                <span class="status-available">{{ formValue().subdomain }}.foliokitcms.com is available ✓</span>
              }
              @case ('taken') {
                <span class="status-taken">That subdomain is taken</span>
              }
              @case ('reserved') {
                <span class="status-reserved">That subdomain is not allowed</span>
              }
              @case ('invalid') {
                <span class="status-invalid">That subdomain is not allowed</span>
              }
              @case ('error') {
                <span class="status-error">Could not check availability</span>
              }
            }
          </div>
        </div>

        <button
          class="submit-btn"
          [disabled]="!canSubmit()"
          (click)="onSubmit()"
        >
          @if (submitState() === 'submitting') {
            Creating your site…
          } @else {
            Create site
          }
        </button>

        @if (submitState() === 'error' && errorMessage()) {
          <p class="error-message">{{ errorMessage() }}</p>
        }
      }
    </div>
  `,
})
export class SignupComponent {
  private readonly destroyRef = inject(DestroyRef);
  private checkTimer: ReturnType<typeof setTimeout> | null = null;

  readonly formValue = signal<SignupFormValue>({ email: '', subdomain: '', displayName: '' });
  readonly subdomainAvailability = signal<SubdomainAvailability>({ status: 'idle' });
  readonly submitState = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  readonly provisionResult = signal<ProvisionResult | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly canSubmit = computed(() => {
    const { email, subdomain, displayName } = this.formValue();
    return (
      displayName.trim().length > 0 &&
      EMAIL_RE.test(email) &&
      SUBDOMAIN_RE.test(subdomain) &&
      this.subdomainAvailability().status === 'available' &&
      this.submitState() !== 'submitting'
    );
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.checkTimer) clearTimeout(this.checkTimer);
    });
  }

  updateField(field: keyof SignupFormValue, value: string): void {
    this.formValue.update(v => ({ ...v, [field]: value }));
  }

  onSubdomainChange(value: string): void {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    this.formValue.update(v => ({ ...v, subdomain: normalized }));

    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
    }

    if (normalized.length < 3) {
      this.subdomainAvailability.set({ status: 'idle' });
      return;
    }

    this.subdomainAvailability.set({ status: 'checking' });

    this.checkTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${cfUrl('checkSubdomain')}?subdomain=${encodeURIComponent(normalized)}`,
        );
        if (!res.ok) {
          this.subdomainAvailability.set({ status: 'error' });
          return;
        }
        const data = await res.json();
        if (data.available) {
          this.subdomainAvailability.set({ status: 'available' });
        } else {
          const statusMap: Record<string, SubdomainAvailability['status']> = {
            invalid_format: 'invalid',
            reserved: 'reserved',
            taken: 'taken',
          };
          this.subdomainAvailability.set({ status: statusMap[data.reason] ?? 'error' });
        }
      } catch {
        this.subdomainAvailability.set({ status: 'error' });
      }
    }, 600);
  }

  async onSubmit(): Promise<void> {
    if (!this.canSubmit()) return;

    this.submitState.set('submitting');
    this.errorMessage.set(null);

    try {
      const res = await fetch(cfUrl('provisionTenant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formValue()),
      });

      const data = await res.json();

      if (!res.ok) {
        const messages: Record<string, string> = {
          subdomain_taken: 'That subdomain was just taken. Please try another.',
          subdomain_reserved: 'That subdomain is not allowed.',
          invalid_email: 'Please enter a valid email address.',
          invalid_subdomain: 'Please enter a valid subdomain.',
          invalid_display_name: 'Please enter a display name (max 80 characters).',
        };
        this.errorMessage.set(messages[data.error] ?? 'Something went wrong. Please try again.');
        this.submitState.set('error');
        return;
      }

      this.provisionResult.set(data as ProvisionResult);
      this.submitState.set('success');
    } catch {
      this.errorMessage.set('Network error. Please check your connection and try again.');
      this.submitState.set('error');
    }
  }
}
