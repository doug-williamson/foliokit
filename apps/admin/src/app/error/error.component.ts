import { ChangeDetectionStrategy, Component, input } from '@angular/core';

const MESSAGES: Record<string, string> = {
  tenant_not_found: 'No tenant found for this account. Please contact support.',
  tenant_ambiguous:
    'Multiple tenants are associated with this account. Please contact support.',
};

@Component({
  selector: 'app-error',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="error-container">
      <h1>Something went wrong</h1>
      <p>{{ message() }}</p>
    </div>
  `,
  styles: `
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      font-family: sans-serif;
      text-align: center;
      padding: 2rem;
    }
  `,
})
export class ErrorComponent {
  readonly code = input<string>('');

  readonly message = () =>
    MESSAGES[this.code()] ?? 'An unexpected error occurred.';
}
