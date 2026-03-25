import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
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
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 class="text-3xl font-bold tracking-tight">FolioKit</h1>
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
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const user = this.authService.user();
      if (user === undefined) return;
      if (user === null) return;
      if (!this.authService.isAdmin()) {
        this.authService.signOut();
        this.error.set('Access denied. This account is not authorized.');
        return;
      }
      this.router.navigate(['/posts']);
    });
  }

  protected async signIn(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
    } catch (err) {
      console.error('[Auth] signInWithGoogle failed:', err);
      this.error.set('Sign-in failed. Please try again.');
    }
  }
}
