import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { DocsPageMeta } from '@foliokit/docs-ui';

@Injectable({ providedIn: 'root' })
export class DocsSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateMeta());
  }

  private updateMeta(): void {
    const route = this.getDeepestChild(this.router.routerState.root.snapshot);
    const pageMeta = route.data['meta'] as DocsPageMeta | undefined;

    const pageTitle = pageMeta?.title
      ? `${pageMeta.title} — FolioKit`
      : 'FolioKit Docs';
    const description = pageMeta?.description ?? '';

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
  }

  private getDeepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
