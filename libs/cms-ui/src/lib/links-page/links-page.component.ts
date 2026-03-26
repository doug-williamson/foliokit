import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import type { LinksPageConfig, LinksLink } from '@foliokit/cms-core';
import type { SocialPlatform } from '@foliokit/cms-core';
import { ThemeService } from '../theme.service';

const PLATFORM_ICONS: Record<SocialPlatform, string> = {
  youtube: 'fa-brands fa-youtube',
  twitch: 'fa-brands fa-twitch',
  twitter: 'fa-brands fa-x-twitter',
  bluesky: 'fa-brands fa-bluesky',
  github: 'fa-brands fa-github',
  linkedin: 'fa-brands fa-linkedin-in',
  instagram: 'fa-brands fa-instagram',
  tiktok: 'fa-brands fa-tiktok',
  facebook: 'fa-brands fa-facebook',
  email: 'fa-solid fa-envelope',
  website: 'fa-solid fa-globe',
};

@Component({
  selector: 'cms-links-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  styles: [`
    .link-btn {
      background-color: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
    .link-btn-featured {
      background-color: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }
    .link-btn:hover, .link-btn-featured:hover {
      opacity: 0.92;
    }
  `],
  template: `
    @if (page()) {
      <div class="flex flex-col items-center max-w-md mx-auto px-4 py-12 gap-6">
        @if (page()!.avatarUrl) {
          <img
            class="w-24 h-24 rounded-full object-cover shadow-md"
            [src]="theme.scheme() === 'dark' && page()!.avatarUrlDark ? page()!.avatarUrlDark : page()!.avatarUrl"
            [alt]="page()!.avatarAlt || page()!.title"
          />
        }
        @if (page()!.headline) {
          <h1 class="text-2xl font-bold text-center">{{ page()!.headline }}</h1>
        }
        @if (page()!.bio) {
          <p class="text-center opacity-70">{{ page()!.bio }}</p>
        }
        <nav class="flex flex-col w-full gap-3">
          @for (link of sortedLinks(); track link.id) {
            <a
              [href]="link.url"
              target="_blank"
              rel="noopener noreferrer"
              [class]="link.highlighted ? 'link-btn-featured' : 'link-btn'"
              class="w-full flex items-center rounded-full px-5 !py-3 text-base font-medium transition-opacity no-underline"
            >
              <span class="w-6 flex-shrink-0 text-lg leading-none">
                @if (getIcon(link)) {
                  <i [class]="getIcon(link)"></i>
                }
              </span>
              <span class="flex-1 text-center">{{ link.label }}</span>
              <span class="w-6 flex-shrink-0"></span>
            </a>
          }
        </nav>
      </div>
    } @else {
      <p class="p-10 text-center opacity-50">No content available.</p>
    }
  `,
})
export class LinksPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);
  readonly theme = inject(ThemeService);

  readonly page = toSignal(
    this.route.data.pipe(map((data) => (data['page'] as LinksPageConfig) ?? null)),
    { initialValue: (this.route.snapshot.data['page'] as LinksPageConfig) ?? null },
  );

  readonly sortedLinks = computed<LinksLink[]>(() =>
    [...(this.page()?.links ?? [])].sort((a, b) => a.order - b.order),
  );

  getIcon(link: LinksLink): string {
    if (link.icon) return link.icon;
    if (link.platform) return PLATFORM_ICONS[link.platform] ?? '';
    return '';
  }

  constructor() {
    effect(() => {
      const p = this.page();
      if (!p) return;
      if (!isPlatformBrowser(this.platformId)) return;
      this.title.setTitle(p.seo?.title ?? p.title ?? 'Links');
      if (p.seo?.description) {
        this.meta.updateTag({ name: 'description', content: p.seo.description });
      }
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
