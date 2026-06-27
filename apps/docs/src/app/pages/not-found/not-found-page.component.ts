import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RhombusButtonComponent } from '@rhombuskit/core';

@Component({
  selector: 'docs-not-found-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusButtonComponent],
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
      <p class="text-8xl font-bold m-0" style="color: var(--border-strong)">404</p>
      <h1 class="text-2xl font-semibold m-0">Page not found</h1>
      <p class="m-0 leading-relaxed" style="color: var(--text-secondary)">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <rhombus-button variant="primary" routerLink="/docs/getting-started">Back to Docs</rhombus-button>
    </div>
  `,
})
export class NotFoundPageComponent {}
