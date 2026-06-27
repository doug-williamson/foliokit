import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RhombusInputComponent, RhombusButtonComponent } from '@rhombuskit/core';
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
  imports: [RhombusInputComponent, RhombusButtonComponent],
  styles: [`
    :host {
      display: block;
      min-height: 80vh;
      background: linear-gradient(160deg, var(--bg) 0%, var(--bg-subtle) 100%);
      padding: 4rem 1.5rem;
    }
    .signup-container {
      max-width: 480px;
      margin: 0 auto;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-accent);
      margin: 0 0 0.5rem;
    }
    .subtitle {
      color: var(--text-secondary);
      margin: 0 0 2rem;
      font-size: 1rem;
      line-height: 1.5;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .availability-status {
      font-size: 0.8125rem;
      margin-top: 0.25rem;
      min-height: 1.25rem;
    }
    .status-checking,
    .status-error { color: var(--text-muted); }
    .status-available { color: var(--status-published-text); }
    .status-taken,
    .status-invalid,
    .status-reserved { color: var(--error); }
    .submit-row {
      margin-top: 0.5rem;
    }
    .error-message {
      color: var(--error);
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
    .success-body {
      color: var(--text-secondary);
      font-size: 0.9375rem;
      line-height: 1.6;
      margin: 1rem 0 0;
    }
  `],
  template: `
    <div class="signup-container">
      @if (submitState() === 'success') {
        <div class="success-container">
          <h1>Your site is ready</h1>
          <rhombus-button
            appearance="text"
            [href]="provisionResult()!.blogUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ provisionResult()!.blogUrl }}
          </rhombus-button>
          <p class="success-body">
            Check your email for a sign-in link to your admin dashboard.
            It may take a minute to arrive.
          </p>
        </div>
      } @else {
        <h1>Get Started</h1>
        <p class="subtitle">Create your FolioKit site in seconds.</p>

        <div class="form-group">
          <rhombus-input
            label="Display name"
            placeholder="Jane Doe"
            autocomplete="name"
            [control]="displayName"
          />
        </div>

        <div class="form-group">
          <rhombus-input
            label="Email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            [control]="email"
          />
        </div>

        <div class="form-group">
          <rhombus-input
            label="Subdomain"
            placeholder="mysite"
            [control]="subdomain"
          >
            <span matTextSuffix>.foliokitcms.com</span>
          </rhombus-input>
          <div class="availability-status">
            @switch (subdomainAvailability().status) {
              @case ('checking') {
                <span class="status-checking">Checking availability…</span>
              }
              @case ('available') {
                <span class="status-available">{{ subdomainValue() }}.foliokitcms.com is available ✓</span>
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

        <div class="submit-row">
          <rhombus-button
            variant="primary"
            [disabled]="!canSubmit()"
            (click)="onSubmit()"
          >
            @if (submitState() === 'submitting') {
              Creating your site…
            } @else {
              Create site
            }
          </rhombus-button>
        </div>

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

  readonly displayName = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(80)],
  });
  readonly email = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(EMAIL_RE)],
  });
  readonly subdomain = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(SUBDOMAIN_RE)],
  });

  readonly subdomainValue = signal('');
  readonly subdomainAvailability = signal<SubdomainAvailability>({ status: 'idle' });
  readonly submitState = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');
  readonly provisionResult = signal<ProvisionResult | null>(null);
  readonly errorMessage = signal<string | null>(null);

  /** Bumped on any control change so `canSubmit` re-derives from control validity. */
  private readonly rev = signal(0);

  readonly canSubmit = computed(() => {
    this.rev();
    return (
      this.displayName.valid &&
      this.email.valid &&
      this.subdomain.valid &&
      this.subdomainAvailability().status === 'available' &&
      this.submitState() !== 'submitting'
    );
  });

  constructor() {
    this.displayName.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.rev.update(n => n + 1));
    this.email.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.rev.update(n => n + 1));
    this.subdomain.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(v => this.onSubdomainChange(v));

    this.destroyRef.onDestroy(() => {
      if (this.checkTimer) clearTimeout(this.checkTimer);
    });
  }

  private onSubdomainChange(value: string): void {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (normalized !== value) {
      this.subdomain.setValue(normalized, { emitEvent: false });
    }
    this.subdomainValue.set(normalized);
    this.rev.update(n => n + 1);

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

    const formValue: SignupFormValue = {
      email: this.email.value,
      subdomain: this.subdomain.value,
      displayName: this.displayName.value,
    };

    this.submitState.set('submitting');
    this.errorMessage.set(null);

    try {
      const res = await fetch(cfUrl('provisionTenant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValue),
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
