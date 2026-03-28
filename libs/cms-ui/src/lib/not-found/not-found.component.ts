import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'folio-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center text-center px-4" style="color: var(--mat-sys-on-surface)">
      <p class="text-8xl font-bold mb-4" style="color: var(--mat-sys-outline)">404</p>
      <h1 class="text-3xl font-semibold mb-3">Page not found</h1>
      <p class="text-lg mb-8 max-w-md" style="color: var(--mat-sys-on-surface-variant)">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a mat-flat-button routerLink="/">
        <mat-icon svgIcon="home" />
        Back to home
      </a>
    </div>
  `,
})
export class NotFoundComponent {}
