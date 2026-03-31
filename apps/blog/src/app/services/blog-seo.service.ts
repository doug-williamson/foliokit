import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  SITE_CONFIG_SERVICE,
  buildPageTitle,
  resolvePostOgImageUrl,
  toPublicImageUrl,
} from '@foliokit/cms-core';
import type { AboutPageConfig, BlogPost, SiteConfig, IBlogSeoService } from '@foliokit/cms-core';

@Injectable({ providedIn: 'root' })
export class BlogSeoService implements IBlogSeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly siteConfigService = inject(SITE_CONFIG_SERVICE, { optional: true });

  private readonly siteConfig = toSignal(
    (this.siteConfigService?.getConfig() ?? of<SiteConfig | null>(null)).pipe(take(1)),
    { initialValue: null },
  );

  setPostMeta(post: BlogPost, baseUrl: string, authorDisplayName?: string): void {
    const pageTitle = buildPageTitle(post.seo?.title ?? post.title);
    const description = post.seo?.description ?? post.excerpt ?? '';
    const canonical = this.resolvePostCanonical(post, baseUrl);
    const ogImage = resolvePostOgImageUrl(
      post,
      this.siteConfig()?.defaultSeo?.ogImage ?? '',
    );

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'article' });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    if (ogImage) {
      this.meta.updateTag({ property: 'og:image', content: ogImage });
      this.meta.updateTag({ property: 'og:image:secure_url', content: ogImage });
    }
    this.meta.updateTag({ name: 'twitter:card', content: ogImage ? 'summary_large_image' : 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    if (ogImage) {
      this.meta.updateTag({ name: 'twitter:image', content: ogImage });
    }

    this.upsertLinkCanonical(canonical);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt ?? description,
      ...(ogImage ? { image: ogImage } : {}),
      datePublished: new Date(post.publishedAt).toISOString(),
      dateModified: new Date(post.updatedAt).toISOString(),
      ...(authorDisplayName
        ? { author: { '@type': 'Person', name: authorDisplayName } }
        : {}),
      url: canonical,
    };
    this.upsertJsonLd(schema, 'post');
  }

  setAboutMeta(config: AboutPageConfig, baseUrl: string): void {
    const pageTitle = buildPageTitle('About');
    const description = config.seo?.description ?? config.subheadline ?? '';
    const canonical = config.seo?.canonicalUrl ?? `${baseUrl}/about`;
    const ogImage = toPublicImageUrl(
      config.seo?.ogImage ?? this.siteConfig()?.defaultSeo?.ogImage ?? '',
    );

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    if (ogImage) {
      this.meta.updateTag({ property: 'og:image', content: ogImage });
    }

    this.upsertLinkCanonical(canonical);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: config.headline,
      description: config.subheadline ?? '',
      sameAs: (config.socialLinks ?? []).map((l) => l.url),
    };
    this.upsertJsonLd(schema, 'about');
  }

  setDefaultMeta(siteConfig: SiteConfig, canonicalUrl?: string): void {
    const description = siteConfig.defaultSeo?.description ?? '';
    const ogImage = toPublicImageUrl(siteConfig.defaultSeo?.ogImage ?? '');

    this.title.setTitle(buildPageTitle('Blog'));
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: siteConfig.siteName });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl ?? siteConfig.siteUrl });
    if (ogImage) {
      this.meta.updateTag({ property: 'og:image', content: ogImage });
    }

    if (canonicalUrl) {
      this.upsertLinkCanonical(canonicalUrl);
    }

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.siteName,
      url: siteConfig.siteUrl,
    };
    this.upsertJsonLd(schema, 'site');
  }

  /**
   * Open Graph consumers expect the canonical URL to match the link users share. Stored
   * `seo.canonicalUrl` can omit `/posts/`; Facebook then treats og:url vs share URL as a
   * mismatch and often drops image/title from the link preview.
   */
  private resolvePostCanonical(post: BlogPost, baseUrl: string): string {
    const base = baseUrl.replace(/\/$/, '');
    const fallback = `${base}/posts/${post.slug}`;
    const fromSeo = post.seo?.canonicalUrl?.trim();
    if (!fromSeo) return fallback;
    try {
      const u = new URL(fromSeo);
      const path = (u.pathname.replace(/\/$/, '') || '/') as string;
      const expected = `/posts/${post.slug}`;
      if (path === expected) {
        return fromSeo;
      }
    } catch {
      /* invalid URL — use fallback */
    }
    return fallback;
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

  private upsertJsonLd(schema: object, id: string): void {
    const selector = `script[type="application/ld+json"][data-id="${id}"]`;
    let el = this.document.querySelector<HTMLScriptElement>(selector);
    if (!el) {
      el = this.document.createElement('script');
      el.type = 'application/ld+json';
      el.setAttribute('data-id', id);
      this.document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
  }
}
