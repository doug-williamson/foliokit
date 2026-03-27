import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@foliokit/cms-core';

@Component({
  selector: 'admin-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background-color: var(--bg);
        background-image:
          radial-gradient(ellipse 60% 50% at 20% 30%, rgba(42, 151, 151, 0.12) 0%, transparent 70%),
          radial-gradient(ellipse 50% 60% at 80% 70%, rgba(71, 85, 105, 0.10) 0%, transparent 70%);
      }

      :host-context([data-theme="dark"]) {
        background-image:
          radial-gradient(ellipse 60% 50% at 20% 30%, rgba(42, 151, 151, 0.18) 0%, transparent 70%),
          radial-gradient(ellipse 50% 60% at 80% 70%, rgba(56, 178, 172, 0.10) 0%, transparent 70%);
      }

      @keyframes loginCardEnter {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .login-card {
        width: 380px;
        max-width: calc(100vw - 48px);
        background: var(--surface-0);
        border: 1px solid var(--border);
        border-radius: var(--r-xl);
        box-shadow: var(--shadow-lg);
        padding: 40px 36px 36px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      @media (prefers-reduced-motion: no-preference) {
        .login-card {
          animation: loginCardEnter 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      }

      .login-logo {
        position: relative;
        width: 40px;
        height: 40px;
        background: var(--logo-bg);
        border-radius: var(--r-md);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        span {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 900;
          color: var(--logo-text);
          line-height: 1;
        }
      }

      .login-logo-dot {
        position: absolute;
        bottom: 6px;
        right: 6px;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--logo-dot);
      }

      .login-heading {
        font-family: var(--font-display);
        font-size: 24px;
        font-weight: 600;
        color: var(--text-primary);
        line-height: 1.2;
        margin: 16px 0 6px;
        text-align: center;
      }

      .login-subtitle {
        font-family: var(--font-body);
        font-size: 14px;
        color: var(--text-muted);
        margin: 0 0 28px;
        text-align: center;
      }

      .login-btn {
        width: 100%;
      }

      .login-error {
        font-size: 13px;
        color: var(--red-600);
        text-align: center;
        margin-top: 14px;
        line-height: 1.4;
      }
    `,
  ],
  template: `
    <div class="login-card">

      <div class="login-logo">
        <span>F</span>
        <div class="login-logo-dot"></div>
      </div>

      <h1 class="login-heading">FolioKit Admin</h1>
      <p class="login-subtitle">Sign in to continue</p>

      <button mat-flat-button class="login-btn" color="primary" (click)="signIn()">
        Sign in with Google
      </button>

      @if (error()) {
        <p class="login-error">{{ error() }}</p>
      }

    </div>
  `,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/posts']);
    }
  }

  protected async signIn(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
      if (!this.authService.isAdmin()) {
        await this.authService.signOut();
        this.error.set('Access denied. This account is not authorized.');
        return;
      }
      await this.router.navigate(['/posts']);
    } catch (err) {
      console.error('[Auth] signInWithGoogle failed:', err);
      this.error.set('Sign-in failed. Please try again.');
    }
  }
}
