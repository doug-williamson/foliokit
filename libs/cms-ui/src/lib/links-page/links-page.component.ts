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
import { RhombusAvatarComponent, RhombusNavListComponent, type RhombusNavSection } from '@rhombuskit/core';
import type { LinksPageConfig, LinksLink } from '@foliokit/cms-core';
import type { SocialPlatform } from '@foliokit/cms-core';
import { BLOG_SEO_SERVICE } from '@foliokit/cms-core';

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
  imports: [RhombusAvatarComponent, RhombusNavListComponent],
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
      margin-top: 24px;
    }
  `],
  template: `
    @if (page()) {
      <div class="links-container">
        <rhombus-avatar
          size="xl"
          [src]="page()!.avatarUrl ?? null"
          [srcDark]="page()!.avatarUrlDark ?? null"
          [name]="page()!.headline ?? page()!.title ?? ''"
        />

        @if (page()!.headline) {
          <h1 class="links-name">{{ page()!.headline }}</h1>
        }

        @if (page()!.bio) {
          <p class="links-bio">{{ page()!.bio }}</p>
        }

        <rhombus-nav-list
          class="links-nav"
          appearance="list"
          ariaLabel="Links"
          [sections]="navSections()"
        />
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

  /** Link rows as a single nav-list section (full-width "link-row" appearance). */
  readonly navSections = computed<RhombusNavSection[]>(() => [
    {
      items: this.sortedLinks().map((link) => ({
        label: link.label,
        icon: this.getIcon(link),
        href: link.url,
        target: '_blank',
        rel: 'noopener noreferrer',
        trailingIcon: 'chevron_right',
      })),
    },
  ]);

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
