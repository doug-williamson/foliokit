import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import type { LinksPageConfig, LinksLink } from '@foliokit/cms-core';
import type { SocialPlatform } from '@foliokit/cms-core';
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
  selector: 'cms-links-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, ProfileAvatarComponent],
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
      font-weight: 600;
      letter-spacing: -0.01em;
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

    .link-row {
      width: 100%;
      margin-bottom: 8px;
    }

    .link-row .link-label {
      font-weight: 500;
    }

    .link-row .link-icon {
      color: var(--text-accent);
    }

    .link-row .link-chevron {
      margin-left: auto;
      color: var(--text-muted);
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
              matButton="outlined"
              class="link-row"
              [href]="link.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <mat-icon class="link-icon" [svgIcon]="getIcon(link)" />
              <span class="link-label">{{ link.label }}</span>
              <mat-icon class="link-chevron" iconPositionEnd svgIcon="chevron_right" />
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
  private readonly document = inject(DOCUMENT);
  private readonly blogSeoService = inject(BLOG_SEO_SERVICE, { optional: true });
  readonly page = toSignal(
    this.route.data.pipe(map((data) => (data['page'] as LinksPageConfig) ?? null)),
    { initialValue: (this.route.snapshot.data['page'] as LinksPageConfig) ?? null },
  );

  readonly sortedLinks = computed<LinksLink[]>(() =>
    [...(this.page()?.links ?? [])].sort((a, b) => a.order - b.order),
  );

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
      const baseUrl = this.document.location?.origin ?? 'https://blog.foliokitcms.com';
      this.blogSeoService?.setLinksMeta(p, baseUrl);
    });
  }
}
