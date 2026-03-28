import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { MarkdownModule } from 'ngx-markdown';
import { MatIconModule } from '@angular/material/icon';
import type { AboutPageConfig, SocialPlatform } from '@foliokit/cms-core';
import { BLOG_SEO_SERVICE } from '@foliokit/cms-core';
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
  selector: 'folio-blog-about-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownModule, MatIconModule],
  styles: [`
    :host { display: block; }

    .about-container {
      max-width: 600px;
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

    .about-name {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: -0.015em;
      color: var(--text-primary);
      text-align: center;
      margin-top: 16px;
    }

    .about-tagline {
      font-size: 16px;
      line-height: 1.75;
      color: var(--text-secondary);
      text-align: center;
      max-width: 480px;
      margin: 8px auto 0;
    }

    .social-links {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }

    .social-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--border-strong);
      border-radius: var(--r-md);
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      background: var(--surface-0);
      text-decoration: none;
      transition: background 0.12s, color 0.12s;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        background: var(--surface-2);
        color: var(--text-primary);
      }
    }

    .about-divider {
      width: 100%;
      border: none;
      border-top: 1px solid var(--border);
      margin: 24px 0 0;
    }

    .about-prose {
      width: 100%;
      margin-top: 32px;
    }
  `],
  template: `
    @if (about()) {
      <div class="about-container">
        <div class="avatar--xl">
          @if (avatarSrc()) {
            <img [src]="avatarSrc()" [alt]="about()!.photoAlt || about()!.headline" />
          } @else {
            {{ initials() }}
          }
        </div>

        <h1 class="about-name">{{ about()!.headline }}</h1>

        @if (about()!.subheadline) {
          <p class="about-tagline">{{ about()!.subheadline }}</p>
        }

        @if (about()!.socialLinks?.length) {
          <div class="social-links">
            @for (link of about()!.socialLinks; track link.url) {
              <a
                class="social-link"
                [href]="link.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                <mat-icon [svgIcon]="platformIcon(link.platform)" />
                {{ link.label || link.platform }}
              </a>
            }
          </div>
        }

        <hr class="about-divider" />

        <div class="about-prose folio-prose">
          <markdown [data]="about()!.bio" />
        </div>
      </div>
    } @else {
      <p style="padding: 40px; text-align: center; color: var(--text-muted)">No content available.</p>
    }
  `,
})
export class BlogAboutPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly blogSeoService = inject(BLOG_SEO_SERVICE, { optional: true });
  private readonly document = inject(DOCUMENT);
  readonly theme = inject(ThemeService);

  readonly about = toSignal(
    this.route.data.pipe(map((data) => (data['about'] as AboutPageConfig) ?? null)),
    { initialValue: (this.route.snapshot.data['about'] as AboutPageConfig) ?? null },
  );

  protected readonly avatarSrc = computed(() => {
    const a = this.about();
    if (!a) return null;
    if (this.theme.isDark() && a.photoUrlDark) return a.photoUrlDark;
    return a.photoUrl ?? null;
  });

  protected platformIcon(platform?: SocialPlatform): string {
    return platform && PLATFORM_ICONS[platform] ? PLATFORM_ICONS[platform] : 'link';
  }

  protected readonly initials = computed(() => {
    const headline = this.about()?.headline ?? '';
    return headline
      .split(' ')
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase();
  });

  constructor() {
    effect(() => {
      const a = this.about();
      if (!a) return;
      const baseUrl = this.document.location?.origin ?? 'https://blog.foliokitcms.com';
      this.blogSeoService?.setAboutMeta(a, baseUrl);
    });
  }
}
