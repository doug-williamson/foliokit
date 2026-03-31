import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Themed block placeholder with a light pulse. Use inline size via host bindings from inputs.
 */
@Component({
  selector: 'folio-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: '',
  host: {
    role: 'presentation',
    '[style.display]': '"block"',
    '[style.width]': 'width()',
    '[style.minWidth]': 'minWidth()',
    '[style.height]': 'height()',
    '[style.borderRadius]': 'borderRadius()',
    '[class.folio-skeleton--inverse]': 'tone() === "inverse"',
  },
  styles: [`
    :host {
      flex-shrink: 0;
      background: var(--surface-2);
      animation: folio-skeleton-pulse 1.2s ease-in-out infinite;
    }

    :host.folio-skeleton--inverse {
      background: rgba(255, 255, 255, 0.22);
    }

    @keyframes folio-skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.55; }
    }
  `],
})
export class FolioSkeletonComponent {
  /** CSS length, e.g. `100%`, `12rem` */
  readonly width = input<string>('100%');
  readonly minWidth = input<string>('0');
  readonly height = input<string>('1rem');
  readonly borderRadius = input<string>('var(--r-md)');
  /** Light chips on dark hero overlay */
  readonly tone = input<'surface' | 'inverse'>('surface');
}
