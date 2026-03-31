import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { concat, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import type { SiteConfig } from '@foliokit/cms-core';
import { BLOG_SEO_SERVICE, SITE_CONFIG_SERVICE } from '@foliokit/cms-core';
import { FolioSkeletonComponent } from '../skeleton/folio-skeleton.component';

type HomeLoadState =
  | { pending: true }
  | { pending: false; config: SiteConfig | null };

@Component({
  selector: 'folio-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, FolioSkeletonComponent],
  styles: [`
    :host { display: block; height: 100%; }

    .hero {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      min-height: 100%;
      background: var(--bg);
    }

    .hero-inner {
      max-width: 720px;
      width: 100%;
      text-align: center;
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-accent);
      background: var(--teal-50);
      border: 1px solid var(--border-accent);
      padding: 3px 10px;
      border-radius: 100px;
      margin-bottom: 20px;
    }

    [data-theme="dark"] .hero-eyebrow {
      background: color-mix(in srgb, var(--teal-500) 10%, transparent);
    }

    .hero-eyebrow-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--teal-400);
      flex-shrink: 0;
    }

    .hero-headline {
      font-family: var(--font-display);
      font-size: clamp(2.4rem, 5vw, 3.8rem);
      font-weight: 600;
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: var(--text-primary);
      margin-bottom: 18px;
    }

    .hero-subheadline {
      font-size: 16px;
      line-height: 1.75;
      color: var(--text-secondary);
      margin-bottom: 28px;
      max-width: 460px;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-cta-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .hero-skel-eyebrow {
      display: inline-flex;
      margin-bottom: 20px;
    }

    .hero-skel-headline {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }

    .hero-skel-sub {
      max-width: 460px;
      margin: 0 auto 28px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .hero-skel-sub-line-full {
      width: 100%;
    }

    .hero-skel-sub-line--narrow {
      width: 85%;
      align-self: center;
    }

    .btn-primary {
      display: inline-block;
      background: var(--btn-primary-bg);
      color: var(--btn-primary-text);
      font-size: 15px;
      padding: 13px 28px;
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-sm);
      text-decoration: none;
      font-weight: 600;
      font-family: var(--font-body);
      transition: background 0.12s, box-shadow 0.12s, transform 0.12s;

      &:hover {
        background: var(--btn-primary-hover);
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }
    }

    .btn-secondary {
      display: inline-block;
      background: var(--surface-1);
      color: var(--text-primary);
      font-size: 15px;
      padding: 13px 28px;
      border-radius: var(--r-lg);
      border: 1px solid var(--border-strong);
      text-decoration: none;
      font-weight: 600;
      font-family: var(--font-body);
      transition: background 0.12s, transform 0.12s;

      &:hover {
        background: var(--surface-2);
        transform: translateY(-1px);
      }
    }
  `],
  template: `
    <div class="hero">
      <div class="hero-inner">
        @if (configPending()) {
          <div class="hero-skel-eyebrow">
            <folio-skeleton width="7rem" height="1.35rem" borderRadius="100px" />
          </div>
          <div class="hero-skel-headline">
            <folio-skeleton width="min(92%, 22rem)" height="2.75rem" borderRadius="var(--r-lg)" />
            <folio-skeleton width="min(70%, 14rem)" height="2.75rem" borderRadius="var(--r-lg)" />
          </div>
          <div class="hero-skel-sub">
            <div class="hero-skel-sub-line-full">
              <folio-skeleton width="100%" height="1rem" borderRadius="var(--r-md)" />
            </div>
            <div class="hero-skel-sub-line--narrow">
              <folio-skeleton width="100%" height="1rem" borderRadius="var(--r-md)" />
            </div>
          </div>
          <div class="hero-cta-row">
            <folio-skeleton width="9.5rem" height="2.875rem" borderRadius="var(--r-lg)" />
            <folio-skeleton width="7.5rem" height="2.875rem" borderRadius="var(--r-lg)" />
          </div>
        } @else {
          <div class="hero-eyebrow">
            <span class="hero-eyebrow-dot"></span>
            {{ eyebrowLabel() }}
          </div>

          <h1 class="hero-headline" [innerHTML]="heroHeadline()"></h1>

          @if (heroSubheadline()) {
            <p class="hero-subheadline">{{ heroSubheadline() }}</p>
          }

          <div class="hero-cta-row">
            <a class="btn-primary" [routerLink]="ctaUrl()">{{ ctaLabel() }}</a>
            @if (secondaryCtaUrl()) {
              <a class="btn-secondary" [routerLink]="secondaryCtaUrl()">{{ secondaryCtaLabel() }}</a>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class BlogHomeComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly siteConfigService = inject(SITE_CONFIG_SERVICE);
  private readonly blogSeoService = inject(BLOG_SEO_SERVICE, { optional: true });
  private readonly document = inject(DOCUMENT);

  /** Set by {@link createHomeSiteConfigResolver} on standard blog routes (SSR + TransferState). */
  private readonly resolvedHomeConfig = this.route.snapshot.data['homeSiteConfig'] as
    | SiteConfig
    | null
    | undefined;

  private readonly loadState = toSignal(
    this.resolvedHomeConfig !== undefined
      ? of<HomeLoadState>({ pending: false, config: this.resolvedHomeConfig })
      : concat(
          of<HomeLoadState>({ pending: true }),
          this.siteConfigService.getDefaultSiteConfig().pipe(
            take(1),
            map((config): HomeLoadState => ({ pending: false, config })),
          ),
        ),
    {
      initialValue:
        this.resolvedHomeConfig !== undefined
          ? { pending: false, config: this.resolvedHomeConfig }
          : ({ pending: true } satisfies HomeLoadState),
    },
  );

  protected readonly configPending = computed(() => this.loadState().pending);

  private readonly siteConfig = computed((): SiteConfig | null | undefined => {
    const s = this.loadState();
    return s.pending ? undefined : s.config;
  });

  protected readonly eyebrowLabel = computed(() =>
    this.siteConfig()?.siteName ?? 'Blog',
  );

  protected readonly heroHeadline = computed(() =>
    this.siteConfig()?.pages?.home?.heroHeadline || this.siteConfig()?.siteName || 'Welcome',
  );

  protected readonly heroSubheadline = computed(() =>
    this.siteConfig()?.pages?.home?.heroSubheadline,
  );

  protected readonly ctaLabel = computed(() =>
    this.siteConfig()?.pages?.home?.ctaLabel || 'Read Posts',
  );

  protected readonly ctaUrl = computed(() =>
    this.siteConfig()?.pages?.home?.ctaUrl || '/posts',
  );

  protected readonly secondaryCtaLabel = computed(() => 'About');

  protected readonly secondaryCtaUrl = computed(() => {
    const pages = this.siteConfig()?.pages;
    return pages?.about?.enabled ? '/about' : null;
  });

  constructor() {
    effect(() => {
      const s = this.loadState();
      if (s.pending || !s.config) return;
      const baseUrl = this.document.location?.origin ?? 'https://blog.foliokitcms.com';
      this.blogSeoService?.setDefaultMeta(s.config, baseUrl);
    });
  }
}
