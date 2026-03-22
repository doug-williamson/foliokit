import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

type CalloutVariant = 'info' | 'warning' | 'tip' | 'danger';

const VARIANT_ICONS: Record<CalloutVariant, string> = {
  info: 'info',
  warning: 'warning',
  tip: 'lightbulb',
  danger: 'error',
};

@Component({
  selector: 'docs-callout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <aside class="docs-callout docs-callout--{{ variant() }}" role="note">
      <mat-icon class="docs-callout__icon shrink-0" aria-hidden="true">
        {{ icon() }}
      </mat-icon>
      <div class="docs-callout__content min-w-0">
        <ng-content />
      </div>
    </aside>
  `,
  styleUrl: './docs-callout.component.scss',
})
export class DocsCalloutComponent {
  readonly variant = input<CalloutVariant>('info');

  icon() {
    return VARIANT_ICONS[this.variant()];
  }
}
