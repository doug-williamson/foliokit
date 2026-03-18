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
    } catch {
      this.error.set('Sign-in failed. Please try again.');
    }
  }
}
