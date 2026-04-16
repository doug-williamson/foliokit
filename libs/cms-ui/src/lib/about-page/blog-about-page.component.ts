import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { MarkdownComponent } from 'ngx-markdown';
import { MatIconModule } from '@angular/material/icon';
import type { AboutPageConfig, SocialPlatform } from '@foliokit/cms-core';
import { BLOG_SEO_SERVICE } from '@foliokit/cms-core';
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
  selector: 'folio-blog-about-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownComponent, MatIconModule, ProfileAvatarComponent],
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

    .about-name {
      font-family: var(--font-display);
      font-size: clamp(1.8rem, 6vw, 2.8rem);
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: -0.025em;
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

      @media (max-width: 480px) {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
    }

    .social-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border: 1px solid var(--border-strong);
      border-radius: var(--r-lg);
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      font-family: var(--font-body);
      color: var(--text-primary);
      background: var(--surface-1);
      text-decoration: none;
      box-shadow: var(--shadow-sm);
      transition: background 0.12s, box-shadow 0.12s, transform 0.12s, border-color 0.12s;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: var(--text-accent);
      }

      &:hover {
        background: var(--surface-2);
        border-color: var(--border-accent);
        box-shadow: var(--shadow-md);
        transform: translateY(-1px);
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
        <folio-profile-avatar
          [photoUrl]="about()!.photoUrl"
          [photoUrlDark]="about()!.photoUrlDark"
          [alt]="about()!.photoAlt || about()!.headline"
          [initialsFrom]="about()!.headline"
        />

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
  readonly about = toSignal(
    this.route.data.pipe(map((data) => (data['about'] as AboutPageConfig) ?? null)),
    { initialValue: (this.route.snapshot.data['about'] as AboutPageConfig) ?? null },
  );

  protected platformIcon(platform?: SocialPlatform): string {
    return platform && PLATFORM_ICONS[platform] ? PLATFORM_ICONS[platform] : 'link';
  }

  constructor() {
    effect(() => {
      const a = this.about();
      if (!a) return;
      const baseUrl = this.document.location?.origin ?? 'https://blog.foliokitcms.com';
      this.blogSeoService?.setAboutMeta(a, baseUrl);
    });
  }
}
