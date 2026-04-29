import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  SITE_CONFIG_SERVICE,
  buildPageTitle,
  resolvePostCanonicalUrl,
  resolvePostOgImageUrl,
  toPublicImageUrl,
} from '@foliokit/cms-core';
import type {
  AboutPageConfig,
  BlogPost,
  IBlogSeoService,
  LinksPageConfig,
  SiteConfig,
} from '@foliokit/cms-core';

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
    const canonical = resolvePostCanonicalUrl(post, baseUrl);
    const ogImage = resolvePostOgImageUrl(
      post,
      this.siteConfig()?.defaultSeo?.ogImage ?? '',
    );

    this.applyMeta({
      pageTitle,
      description,
      canonical,
      ogImage,
      ogType: 'article',
      noIndex: post.seo?.noIndex,
    });

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

  setHomeMeta(config: SiteConfig, baseUrl: string): void {
    const home = config.pages?.home;
    const pageTitle = home?.seo?.title ?? buildPageTitle(config.siteName ?? 'Home');
    const description =
      home?.seo?.description ?? config.defaultSeo?.description ?? config.description ?? '';
    const canonical = home?.seo?.canonicalUrl ?? baseUrl;
    const ogImage = toPublicImageUrl(
      home?.seo?.ogImage ?? config.defaultSeo?.ogImage ?? '',
    );

    this.applyMeta({
      pageTitle,
      description,
      canonical,
      ogImage,
      ogType: 'website',
      noIndex: home?.seo?.noIndex,
    });

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: config.siteName,
      url: config.siteUrl,
    };
    this.upsertJsonLd(schema, 'site');
  }

  setBlogMeta(config: SiteConfig, baseUrl: string, tag?: string | null): void {
    const blog = config.pages?.blog;
    const baseTitle = blog?.seo?.title ?? buildPageTitle('Blog');
    const pageTitle = tag ? `${baseTitle} #${tag}` : baseTitle;
    const description =
      blog?.seo?.description ?? config.defaultSeo?.description ?? '';
    const canonical = blog?.seo?.canonicalUrl ?? `${baseUrl}/posts`;
    const ogImage = toPublicImageUrl(
      blog?.seo?.ogImage ?? config.defaultSeo?.ogImage ?? '',
    );

    this.applyMeta({
      pageTitle,
      description,
      canonical,
      ogImage,
      ogType: 'website',
      noIndex: blog?.seo?.noIndex,
    });
  }

  setAboutMeta(config: AboutPageConfig, baseUrl: string): void {
    const pageTitle = config.seo?.title ?? buildPageTitle('About');
    const description = config.seo?.description ?? config.subheadline ?? '';
    const canonical = config.seo?.canonicalUrl ?? `${baseUrl}/about`;
    const ogImage = toPublicImageUrl(
      config.seo?.ogImage ?? this.siteConfig()?.defaultSeo?.ogImage ?? '',
    );

    this.applyMeta({
      pageTitle,
      description,
      canonical,
      ogImage,
      ogType: 'website',
      noIndex: config.seo?.noIndex,
    });

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: config.headline,
      description: config.subheadline ?? '',
      sameAs: (config.socialLinks ?? []).map((l) => l.url),
    };
    this.upsertJsonLd(schema, 'about');
  }

  setLinksMeta(config: LinksPageConfig, baseUrl: string): void {
    const pageTitle =
      config.seo?.title ?? config.title ?? buildPageTitle('Links');
    const description = config.seo?.description ?? config.bio ?? '';
    const canonical = config.seo?.canonicalUrl ?? `${baseUrl}/links`;
    const ogImage = toPublicImageUrl(
      config.seo?.ogImage ?? this.siteConfig()?.defaultSeo?.ogImage ?? '',
    );

    this.applyMeta({
      pageTitle,
      description,
      canonical,
      ogImage,
      ogType: 'website',
      noIndex: config.seo?.noIndex,
    });
  }

  setDefaultMeta(siteConfig: SiteConfig, canonicalUrl?: string): void {
    const description = siteConfig.defaultSeo?.description ?? '';
    const ogImage = toPublicImageUrl(siteConfig.defaultSeo?.ogImage ?? '');
    const pageTitle = buildPageTitle('Blog');

    this.applyMeta({
      pageTitle,
      description,
      canonical: canonicalUrl ?? siteConfig.siteUrl,
      ogImage,
      ogType: 'website',
      ogTitleOverride: siteConfig.siteName,
      writeCanonical: !!canonicalUrl,
    });

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: siteConfig.siteName,
      url: siteConfig.siteUrl,
    };
    this.upsertJsonLd(schema, 'site');
  }

  private applyMeta(opts: {
    pageTitle: string;
    description: string;
    canonical: string;
    ogImage: string;
    ogType: 'website' | 'article';
    ogTitleOverride?: string;
    noIndex?: boolean;
    writeCanonical?: boolean;
  }): void {
    const {
      pageTitle,
      description,
      canonical,
      ogImage,
      ogType,
      ogTitleOverride,
      noIndex,
      writeCanonical = true,
    } = opts;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: ogTitleOverride ?? pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: ogType });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    if (ogImage) {
      this.meta.updateTag({ property: 'og:image', content: ogImage });
      this.meta.updateTag({ property: 'og:image:secure_url', content: ogImage });
    }
    this.meta.updateTag({
      name: 'twitter:card',
      content: ogImage ? 'summary_large_image' : 'summary',
    });
    this.meta.updateTag({ name: 'twitter:title', content: ogTitleOverride ?? pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    if (ogImage) {
      this.meta.updateTag({ name: 'twitter:image', content: ogImage });
    }

    if (noIndex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
    } else {
      this.meta.removeTag('name="robots"');
    }

    if (writeCanonical) {
      this.upsertLinkCanonical(canonical);
    }
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
