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
import { MarkdownModule } from 'ngx-markdown';
import { MatIconModule } from '@angular/material/icon';
import type { AboutPageConfig } from '@foliokit/cms-core';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'cms-about-page',
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

    .about-prose {
      width: 100%;
      margin-top: 32px;
    }

    .about-divider {
      width: 100%;
      border: none;
      border-top: 1px solid var(--border);
      margin: 24px 0 0;
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
                <mat-icon svgIcon="link" />
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
export class AboutPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);
  readonly theme = inject(ThemeService);

  readonly about = toSignal(
    this.route.data.pipe(map((data) => (data['about'] as AboutPageConfig) ?? null)),
    { initialValue: (this.route.snapshot.data['about'] as AboutPageConfig) ?? null },
  );

  protected readonly avatarSrc = computed(() =>
    this.theme.isDark() && this.about()?.photoUrlDark
      ? this.about()!.photoUrlDark!
      : this.about()!.photoUrl,
  );

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
      if (!isPlatformBrowser(this.platformId)) return;

      this.title.setTitle(a.seo?.title ?? a.headline);

      if (a.seo?.description) {
        this.meta.updateTag({ name: 'description', content: a.seo.description });
      }
      if (a.seo?.ogImage) {
        this.meta.updateTag({ property: 'og:image', content: a.seo.ogImage });
      }
      if (a.seo?.canonicalUrl) {
        this.meta.updateTag({ rel: 'canonical', href: a.seo.canonicalUrl });
      }
      if (a.seo?.noIndex) {
        this.meta.updateTag({ name: 'robots', content: 'noindex' });
      } else {
        this.meta.removeTag('name="robots"');
      }
    });
  }
}
