import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  RhombusBreadcrumbsComponent,
  type BreadcrumbItem as RhombusBreadcrumbItem,
} from '@rhombuskit/core';
import { DOCS_ROUTE_MANIFEST } from '../../tokens/docs-tokens';
import { DocsRouteNode } from '../../models/docs-route-node.model';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

function findCrumbs(
  nodes: DocsRouteNode[],
  segments: string[],
  accumulated: string
): BreadcrumbItem[] | null {
  for (const node of nodes) {
    if (node.sectionHeader) continue;
    const fullPath = accumulated ? `${accumulated}/${node.path}` : node.path;
    const normalizedPath = node.path.startsWith('/') ? node.path : `/${node.path}`;
    const target = '/' + segments.join('/');

    if (normalizedPath === target) {
      return [{ label: node.label, path: normalizedPath }];
    }

    if (node.children) {
      const child = findCrumbs(node.children, segments, fullPath);
      if (child) {
        return [{ label: node.label, path: normalizedPath }, ...child];
      }
    }
  }
  return null;
}

@Component({
  selector: 'docs-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RhombusBreadcrumbsComponent],
  template: `<rhombus-breadcrumbs ariaLabel="Breadcrumb" [items]="breadcrumbItems()" />`,
})
export class DocsBreadcrumbComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly manifest = inject(DOCS_ROUTE_MANIFEST);

  readonly crumbs = computed<BreadcrumbItem[]>(() => {
    const snapshot = this.route.snapshot;
    const segments = snapshot.url.map((s) => s.path);
    return findCrumbs(this.manifest, segments, '') ?? [];
  });

  /**
   * Adapt the docs crumbs to `rhombus-breadcrumbs` items. The trailing crumb is
   * the current page, so it gets no `link` — rhombus-breadcrumbs renders the last
   * linkless item as the `aria-current` page, matching the prior behaviour.
   */
  readonly breadcrumbItems = computed<RhombusBreadcrumbItem[]>(() => {
    const crumbs = this.crumbs();
    return crumbs.map((crumb, i) =>
      i === crumbs.length - 1
        ? { label: crumb.label }
        : { label: crumb.label, link: crumb.path },
    );
  });
}
