import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { RhombusCodeBlockComponent, RhombusTabGroupDirective } from '@rhombuskit/core';

@Component({
  selector: 'docs-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, RhombusTabGroupDirective, RhombusCodeBlockComponent],
  templateUrl: './docs-preview.component.html',
  styleUrl: './docs-preview.component.scss',
})
export class DocsPreviewComponent {
  @Input() code = '';
}
