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
      color: #1A0A00;
      background: var(--color-punch);
      border: 2px solid #1A0A00;
      padding: 3px 10px;
      border-radius: 0;
      margin-bottom: 20px;
    }

    .hero-eyebrow-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #1A0A00;
      flex-shrink: 0;
    }

    .hero-headline {
      font-family: var(--font-display);
      font-size: clamp(2.5rem, 10vw, 5rem);
      font-weight: 400;
      line-height: 0.95;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--text-primary);
      margin-bottom: 18px;
    }

    .hero-subheadline {
      font-size: 16px;
      font-family: var(--font-body);
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

      @media (max-width: 480px) {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
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
      background: var(--color-punch);
      color: #1A0A00;
      font-size: 1rem;
      padding: 13px 28px;
      border-radius: 0;
      border: 3px solid #1A0A00;
      box-shadow: 4px 4px 0 #1A0A00;
      text-decoration: none;
      font-weight: 400;
      font-family: var(--font-display);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      transition: box-shadow 0.12s, transform 0.12s;

      &:hover {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0 #1A0A00;
      }
    }

    .btn-secondary {
      display: inline-block;
      background: transparent;
      color: var(--text-primary);
      font-size: 1rem;
      padding: 13px 28px;
      border-radius: 0;
      border: 3px solid var(--border);
      box-shadow: 4px 4px 0 var(--border);
      text-decoration: none;
      font-weight: 400;
      font-family: var(--font-display);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      transition: box-shadow 0.12s, transform 0.12s;

      &:hover {
        transform: translate(2px, 2px);
        box-shadow: 2px 2px 0 #1A0A00;
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
