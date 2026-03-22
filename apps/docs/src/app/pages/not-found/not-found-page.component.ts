import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'docs-not-found-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule],
  styles: [`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }
  `],
  template: `
    <div class="flex flex-col items-center gap-6 text-center max-w-md">
      <p class="text-8xl font-bold m-0" style="color: var(--mat-sys-outline)">404</p>
      <h1 class="text-2xl font-semibold m-0">Page not found</h1>
      <p class="m-0 leading-relaxed" style="color: var(--mat-sys-on-surface-variant)">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a mat-flat-button routerLink="/docs/getting-started">Back to Docs</a>
    </div>
  `,
})
export class NotFoundPageComponent {}
