import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DOCS_ROUTE_MANIFEST } from '../../tokens/docs-tokens';
import { DocsNavComponent } from '../../nav/docs-nav/docs-nav.component';
import { DocsPageHeaderComponent } from '../../content/docs-page-header/docs-page-header.component';
import { DocsTocComponent } from '../../nav/docs-toc/docs-toc.component';

@Component({
  selector: 'docs-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    DocsNavComponent,
    DocsPageHeaderComponent,
    DocsTocComponent,
  ],
  templateUrl: './docs-shell.component.html',
  styleUrl: './docs-shell.component.scss',
})
export class DocsShellComponent {
  readonly manifest = inject(DOCS_ROUTE_MANIFEST);
  readonly sidenavOpen = signal(true);
}
