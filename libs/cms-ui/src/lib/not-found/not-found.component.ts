import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RhombusButtonComponent, RhombusIconComponent } from '@rhombuskit/core';

@Component({
  selector: 'folio-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RhombusButtonComponent, RhombusIconComponent],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center text-center px-4" style="color: var(--text-primary)">
      <p class="text-8xl font-bold mb-4" style="color: var(--border-strong)">404</p>
      <h1 class="text-3xl font-semibold mb-3">Page not found</h1>
      <p class="text-lg mb-8 max-w-md" style="color: var(--text-secondary)">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <rhombus-button variant="primary" routerLink="/">
        <rhombus-icon name="home" />
        Back to home
      </rhombus-button>
    </div>
  `,
})
export class NotFoundComponent {}
