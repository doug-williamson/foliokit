import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  RhombusNavListComponent,
  type RhombusNavItem,
  type RhombusNavSection,
} from '@rhombuskit/core';
import { DocsRouteNode } from '../../models/docs-route-node.model';

/**
 * Docs sidebar. Maps the 2-level `DocsRouteNode[]` manifest onto a single
 * `rhombus-nav-list` section: each top-level node is a navigable item that also
 * carries its `children` (RhombusKit 1.10.0+ renders a routed parent with
 * `children` as a navigable row whose children sit nested beneath it). Active
 * highlighting is handled by the nav-list's own `routerLinkActive`.
 */
@Component({
  selector: 'docs-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusNavListComponent],
  template: `<rhombus-nav-list ariaLabel="Documentation" [sections]="navSections()" />`,
})
export class DocsNavComponent {
  readonly manifest = input.required<DocsRouteNode[]>();

  readonly navSections = computed<RhombusNavSection[]>(() => [
    { items: this.manifest().map((node) => this.toNavItem(node)) },
  ]);

  private toNavItem(node: DocsRouteNode): RhombusNavItem {
    const item: RhombusNavItem = {
      label: node.label,
      routerLink: node.path,
      ...(node.icon ? { icon: node.icon } : {}),
      ...(node.badge ? { badge: node.badge } : {}),
    };
    if (node.children?.length) {
      item.children = node.children.map((child) => this.toNavItem(child));
      item.expanded = true;
    }
    return item;
  }
}
