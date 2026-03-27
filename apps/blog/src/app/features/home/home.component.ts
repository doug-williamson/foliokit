import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';
import { SiteConfigService } from '@foliokit/cms-core';
import { BlogSeoService } from '../../services/blog-seo.service';

@Component({
  selector: 'folio-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink],
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
      </div>
    </div>
  `,
})
export class HomeComponent {
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly blogSeoService = inject(BlogSeoService);

  private readonly siteConfig = toSignal(
    this.siteConfigService.getDefaultSiteConfig().pipe(take(1)),
    { initialValue: null },
  );

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
      const config = this.siteConfig();
      if (!config) return;
      this.blogSeoService.setDefaultMeta(config);
    });
  }
}
