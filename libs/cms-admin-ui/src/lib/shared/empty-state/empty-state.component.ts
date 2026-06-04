import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RhombusEmptyStateComponent } from '@rhombuskit/core';

@Component({
  selector: 'folio-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusEmptyStateComponent],
  template: `
    <rhombus-empty-state
      [icon]="icon()"
      [heading]="heading()"
      [body]="body()"
      [ctaLabel]="ctaLabel()"
      (ctaClick)="ctaClick.emit()"
    />
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly heading = input.required<string>();
  readonly body = input<string>('');
  readonly ctaLabel = input<string>('');
  readonly ctaClick = output<void>();
}
