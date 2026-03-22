import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'docs-marketing-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './marketing-shell.component.html',
  styleUrl: './marketing-shell.component.scss',
})
export class MarketingShellComponent {}
