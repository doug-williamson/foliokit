import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'folio-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-state-icon" [svgIcon]="icon()" />
      <p class="empty-state-heading">{{ heading() }}</p>
      @if (body()) {
        <p class="empty-state-body">{{ body() }}</p>
      }
      @if (ctaLabel()) {
        <button mat-stroked-button (click)="ctaClick.emit()">
          {{ ctaLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly heading = input.required<string>();
  readonly body = input<string>('');
  readonly ctaLabel = input<string>('');
  readonly ctaClick = output<void>();
}
