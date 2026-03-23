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
import { MarkdownModule } from 'ngx-markdown';
import type { AboutPageConfig } from '@foliokit/cms-core';
import { BlogSeoService } from '../../services/blog-seo.service';

@Component({
  selector: 'blog-about-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownModule],
  template: `
    @if (about()) {
      <article class="max-w-3xl mx-auto px-4 py-10">
        @if (about()!.photoUrl) {
          <img
            class="w-32 h-32 rounded-full object-cover mb-6"
            [src]="about()!.photoUrl"
            [alt]="about()!.photoAlt || about()!.headline"
          />
        }

        <h1 class="text-3xl font-bold mb-2">{{ about()!.headline }}</h1>

        @if (about()!.subheadline) {
          <p class="text-lg opacity-70 mb-6">{{ about()!.subheadline }}</p>
        }

        <markdown [data]="about()!.bio" class="folio-prose" />

        @if (about()!.socialLinks?.length) {
          <ul class="flex flex-wrap gap-4 mt-8">
            @for (link of about()!.socialLinks; track link.url) {
              <li>
                <a
                  [href]="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sm underline opacity-70 hover:opacity-100"
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
export class BlogAboutPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly blogSeoService = inject(BlogSeoService);
  private readonly document = inject(DOCUMENT);

  readonly about = toSignal(
    this.route.data.pipe(map((data) => (data['about'] as AboutPageConfig) ?? null)),
    { initialValue: (this.route.snapshot.data['about'] as AboutPageConfig) ?? null },
  );

  constructor() {
    effect(() => {
      const a = this.about();
      if (!a) return;
      const baseUrl = this.document.location?.origin ?? 'https://blog.foliokitcms.com';
      this.blogSeoService.setAboutMeta(a, baseUrl);
    });
  }
}
