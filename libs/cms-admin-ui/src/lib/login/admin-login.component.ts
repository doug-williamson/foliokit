import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@foliokit/cms-core';

/**
 * Ready-made admin login screen backed by Firebase Google Auth.
 *
 * Handles the full sign-in flow:
 * - Redirects already-authenticated admins to `redirectTo` on init
 * - Opens the Google sign-in popup
 * - Verifies `AuthService.isAdmin()` after sign-in and signs the user out
 *   with an "Access denied" message if the account is not authorized
 *
 * @example
 * ```html
 * <!-- In a route template or lazy-loaded component -->
 * <folio-admin-login appName="My Site Admin" redirectTo="/dashboard" />
 * ```
 */
@Component({
  selector: 'folio-admin-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 class="text-3xl font-bold tracking-tight">{{ appName() }}</h1>
      <p class="text-sm text-gray-500">Admin</p>
      <button mat-raised-button color="primary" (click)="signIn()">
        Sign in with Google
      </button>
      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }
    </div>
  `,
})
export class AdminLoginComponent implements OnInit {
  /**
   * Application name displayed as the page heading.
   * @default 'Admin'
   */
  readonly appName = input<string>('Admin');

  /**
   * Route to navigate to after a successful sign-in.
   * @default '/dashboard'
   */
  readonly redirectTo = input<string>('/dashboard');

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.redirectTo()]);
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
      await this.router.navigate([this.redirectTo()]);
    } catch (err) {
      console.error('[Auth] signInWithGoogle failed:', err);
      this.error.set('Sign-in failed. Please try again.');
    }
  }
}
