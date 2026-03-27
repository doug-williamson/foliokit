import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { DocsPageMeta } from '@foliokit/docs-ui';

const BASE_URL = 'https://foliokitcms.com';
const SITE_NAME = 'FolioKit Docs';
const DEFAULT_DESCRIPTION =
  'FolioKit — Angular component library for building CMS-powered portfolio sites with Firebase.';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

@Injectable({ providedIn: 'root' })
export class DocsSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateMeta());
  }

  private updateMeta(): void {
    const route = this.getDeepestChild(this.router.routerState.root.snapshot);
    const pageMeta = route.data['meta'] as DocsPageMeta | undefined;

    const pageTitle = pageMeta?.title
      ? `${pageMeta.title} — ${SITE_NAME}`
      : SITE_NAME;
    const description = pageMeta?.description || DEFAULT_DESCRIPTION;
    const url = `${BASE_URL}${this.router.url.split('?')[0].split('#')[0]}`;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: DEFAULT_OG_IMAGE });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_NAME });

    this.upsertLinkCanonical(url);
  }

  private upsertLinkCanonical(href: string): void {
    let el = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
      el = this.document.createElement('link');
      el.rel = 'canonical';
      this.document.head.appendChild(el);
    }
    el.href = href;
  }

  private getDeepestChild(route: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = route;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
