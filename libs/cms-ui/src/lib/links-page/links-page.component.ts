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
import { ProfileAvatarComponent } from '../profile-avatar/profile-avatar.component';

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
  imports: [MatIconModule, ProfileAvatarComponent],
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

    .links-name {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 400;
      letter-spacing: 0.04em;
      text-transform: uppercase;
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
      margin-top: 0;
      margin-bottom: 4px;
      background: var(--surface-0);
      border: 2px solid #1A0A00;
      border-radius: 0;
      padding: 13px 18px;
      box-shadow: none;
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.12s, color 0.12s;

      &:hover {
        background: var(--color-punch);
        color: #1A0A00;
        border-color: #1A0A00;

        .link-icon {
          color: #1A0A00;
        }

        .link-label {
          color: #1A0A00;
        }

        .link-chevron {
          color: #1A0A00;
        }
      }

      .link-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--color-hero);
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
        <folio-profile-avatar
          [photoUrl]="page()!.avatarUrl"
          [photoUrlDark]="page()!.avatarUrlDark"
          [alt]="page()!.avatarAlt || page()!.title || ''"
          [initialsFrom]="page()!.headline ?? page()!.title ?? ''"
        />

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
              <mat-icon class="link-icon" [svgIcon]="getIcon(link)" />
              <span class="link-label">{{ link.label }}</span>
              <mat-icon class="link-chevron" svgIcon="chevron_right" />
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
  readonly page = toSignal(
    this.route.data.pipe(map((data) => (data['page'] as LinksPageConfig) ?? null)),
    { initialValue: (this.route.snapshot.data['page'] as LinksPageConfig) ?? null },
  );

  readonly sortedLinks = computed<LinksLink[]>(() =>
    [...(this.page()?.links ?? [])].sort((a, b) => a.order - b.order),
  );

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
