import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import type { LinksPageConfig, LinksLink } from '@foliokit/cms-core';
import type { SocialPlatform } from '@foliokit/cms-core';
import { ThemeService } from '../theme.service';

const PLATFORM_ICONS: Record<SocialPlatform, string> = {
  youtube: 'play_circle',
  twitch: 'live_tv',
  twitter: 'tag',
  bluesky: 'cloud',
  github: 'code',
  linkedin: 'business',
  instagram: 'photo_camera',
  tiktok: 'music_note',
  facebook: 'thumb_up',
  email: 'mail',
  website: 'language',
};

@Component({
  selector: 'cms-links-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  styles: [`
    :host { display: block; }

    .links-container {
      max-width: 480px;
      margin: 48px auto;
      padding: 0 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .avatar--xl {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: var(--logo-bg);
      color: var(--logo-text);
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .links-name {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: -0.015em;
      color: var(--text-primary);
      text-align: center;
      margin-top: 16px;
    }

    .links-bio {
      font-size: 16px;
      line-height: 1.75;
      color: var(--text-secondary);
      text-align: center;
      max-width: 480px;
      margin: 8px auto 0;
    }

    .links-nav {
      width: 100%;
      display: flex;
      flex-direction: column;
      margin-top: 24px;
    }

    .link-btn {
      width: 100%;
      margin-top: 12px;
      background: var(--surface-0);
      border: 1px solid var(--border-strong);
      border-radius: var(--r-lg);
      padding: 13px 18px;
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      cursor: pointer;
      transition: box-shadow 0.12s, transform 0.12s;

      &:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
      }

      .link-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--text-accent);
        flex-shrink: 0;
      }

      .link-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary);
        flex: 1;
      }

      .link-chevron {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: var(--text-muted);
        flex-shrink: 0;
      }
    }
  `],
  template: `
    @if (page()) {
      <div class="links-container">
        <div class="avatar--xl">
          @if (avatarSrc()) {
            <img [src]="avatarSrc()" [alt]="page()!.avatarAlt || page()!.title" />
          } @else {
            {{ initials() }}
          }
        </div>

        @if (page()!.headline) {
          <h1 class="links-name">{{ page()!.headline }}</h1>
        }

        @if (page()!.bio) {
          <p class="links-bio">{{ page()!.bio }}</p>
        }

        <nav class="links-nav">
          @for (link of sortedLinks(); track link.id) {
            <a
              class="link-btn"
              [href]="link.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <mat-icon class="link-icon">{{ getIcon(link) }}</mat-icon>
              <span class="link-label">{{ link.label }}</span>
              <mat-icon class="link-chevron">chevron_right</mat-icon>
            </a>
          }
        </nav>
      </div>
    } @else {
      <p style="padding: 40px; text-align: center; color: var(--text-muted)">No content available.</p>
    }
  `,
})
export class LinksPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  readonly theme = inject(ThemeService);

  readonly page = toSignal(
    this.route.data.pipe(map((data) => (data['page'] as LinksPageConfig) ?? null)),
    { initialValue: (this.route.snapshot.data['page'] as LinksPageConfig) ?? null },
  );

  readonly sortedLinks = computed<LinksLink[]>(() =>
    [...(this.page()?.links ?? [])].sort((a, b) => a.order - b.order),
  );

  protected readonly avatarSrc = computed(() =>
    this.theme.isDark() && this.page()?.avatarUrlDark
      ? this.page()!.avatarUrlDark!
      : this.page()!.avatarUrl,
  );

  protected readonly initials = computed(() => {
    const headline = this.page()?.headline ?? this.page()?.title ?? '';
    return headline
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase();
  });

  private upsertCanonical(href: string): void {
    let el = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
      el = this.document.createElement('link');
      el.rel = 'canonical';
      this.document.head.appendChild(el);
    }
    el.href = href;
  }

  getIcon(link: LinksLink): string {
    if (link.platform && PLATFORM_ICONS[link.platform]) {
      return PLATFORM_ICONS[link.platform];
    }
    return 'open_in_new';
  }

  constructor() {
    effect(() => {
      const p = this.page();
      if (!p) return;
      if (!isPlatformBrowser(this.platformId)) return;
      const pageTitle = p.seo?.title ?? p.title ?? 'Links';
      this.title.setTitle(pageTitle);
      if (p.seo?.description) {
        this.meta.updateTag({ name: 'description', content: p.seo.description });
      }
      this.meta.updateTag({ property: 'og:title', content: pageTitle });
      this.meta.updateTag({ property: 'og:type', content: 'website' });
      const canonicalUrl = `${this.document.location?.origin ?? ''}/links`;
      this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
      this.upsertCanonical(canonicalUrl);
      if (p.seo?.ogImage) {
        this.meta.updateTag({ property: 'og:image', content: p.seo.ogImage });
      }
      if (p.seo?.noIndex) {
        this.meta.updateTag({ name: 'robots', content: 'noindex' });
      } else {
        this.meta.removeTag('name="robots"');
      }
    });
  }
}
