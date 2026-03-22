import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
  imports: [RouterLink],
  templateUrl: './docs-breadcrumb.component.html',
})
export class DocsBreadcrumbComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly manifest = inject(DOCS_ROUTE_MANIFEST);

  readonly crumbs = computed<BreadcrumbItem[]>(() => {
    const snapshot = this.route.snapshot;
    const segments = snapshot.url.map((s) => s.path);
    return findCrumbs(this.manifest, segments, '') ?? [];
  });
}
