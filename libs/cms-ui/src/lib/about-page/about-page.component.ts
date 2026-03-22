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
import type { AboutPage } from '@foliokit/cms-core';

@Component({
  selector: 'cms-about-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownModule],
  template: `
    @if (page()) {
      <article class="max-w-3xl mx-auto px-4 py-10">
        @if (page()!.heroImageUrl) {
          <img
            class="w-full rounded-xl object-cover mb-8 max-h-80"
            [src]="page()!.heroImageUrl"
            [alt]="page()!.heroImageAlt || page()!.title"
          />
        }
        <markdown [data]="page()!.body" class="folio-prose" />
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

  readonly page = toSignal(
    this.route.data.pipe(map((data) => (data['page'] as AboutPage) ?? null)),
    { initialValue: (this.route.snapshot.data['page'] as AboutPage) ?? null },
  );

  constructor() {
    effect(() => {
      const p = this.page();
      if (!p) return;
      if (!isPlatformBrowser(this.platformId)) return;
      this.title.setTitle(p.seo?.title ?? p.title);
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
