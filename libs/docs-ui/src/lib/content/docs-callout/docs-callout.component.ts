import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RhombusIconComponent } from '@rhombuskit/core';

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
  imports: [RhombusIconComponent],
  template: `
    <aside class="docs-callout docs-callout--{{ variant() }}" role="note">
      <rhombus-icon class="docs-callout__icon shrink-0" [name]="icon()" />
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
