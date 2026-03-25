import {
  ChangeDetectionStrategy,
  Component,
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
import type { AboutPageConfig } from '@foliokit/cms-core';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'cms-about-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownModule],
  template: `
    @if (about()) {
      <article class="max-w-3xl mx-auto px-4 py-10">
        @if (about()!.photoUrl) {
          <img
            class="w-32 h-32 rounded-full object-cover mb-6 block mx-auto sm:mx-0"
            [src]="theme.scheme() === 'dark' && about()!.photoUrlDark ? about()!.photoUrlDark : about()!.photoUrl"
            [alt]="about()!.photoAlt || about()!.headline"
          />
        }

        <h1 class="text-3xl font-bold mb-2 text-center sm:text-left">{{ about()!.headline }}</h1>

        @if (about()!.subheadline) {
          <p class="text-lg opacity-70 mb-8 text-center sm:text-left">{{ about()!.subheadline }}</p>
        }

        <hr class="border-t border-black/10 dark:border-white/10 mb-8" />

        <markdown [data]="about()!.bio" class="folio-prose" />

        @if (about()!.socialLinks?.length) {
          <ul class="flex flex-wrap gap-6 mt-8">
            @for (link of about()!.socialLinks; track link.url) {
              <li>
                <a
                  [href]="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm font-medium underline opacity-70 hover:opacity-100"
                >
                  {{ link.label || link.platform }}
                </a>
              </li>
            }
          </ul>
        }
      </article>
    } @else {
      <p class="p-10 text-center opacity-50">No content available.</p>
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
