import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'docs-marketing-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  templateUrl: './marketing-shell.component.html',
  styleUrl: './marketing-shell.component.scss',
})
export class MarketingShellComponent {}
