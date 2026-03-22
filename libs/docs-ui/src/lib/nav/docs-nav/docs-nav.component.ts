import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DocsRouteNode } from '../../models/docs-route-node.model';

@Component({
  selector: 'docs-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './docs-nav.component.html',
  styleUrl: './docs-nav.component.scss',
})
export class DocsNavComponent {
  readonly manifest = input.required<DocsRouteNode[]>();

  readonly expanded = signal<Set<string>>(new Set());

  isExpanded(path: string): boolean {
    return this.expanded().has(path);
  }

  toggle(path: string): void {
    this.expanded.update((set) => {
      const next = new Set(set);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }
}
