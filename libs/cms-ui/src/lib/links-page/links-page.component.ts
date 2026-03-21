import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnChanges,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import type { LinksPage, LinksLink } from '@foliokit/cms-core';

@Component({
  selector: 'cms-links-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  template: `
    <div class="flex flex-col items-center max-w-md mx-auto px-4 py-12 gap-6">
      @if (page().avatarUrl) {
        <img
          class="w-24 h-24 rounded-full object-cover"
          [src]="page().avatarUrl"
          [alt]="page().avatarAlt || page().title"
        />
      }
      @if (page().headline) {
        <h1 class="text-2xl font-bold text-center">{{ page().headline }}</h1>
      }
      @if (page().bio) {
        <p class="text-center opacity-70">{{ page().bio }}</p>
      }
      <nav class="flex flex-col w-full gap-3">
        @for (link of sortedLinks(); track link.id) {
          <a
            [href]="link.url"
            target="_blank"
            rel="noopener noreferrer"
            mat-flat-button
            [color]="link.highlighted ? 'accent' : undefined"
            class="w-full !py-3 !text-base"
          >
            {{ link.label }}
          </a>
        }
      </nav>
    </div>
  `,
})
export class LinksPageComponent implements OnChanges {
  readonly page = input.required<LinksPage>();

  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);

  get sortedLinks(): () => LinksLink[] {
    return () => [...this.page().links].sort((a, b) => a.order - b.order);
  }

  ngOnChanges(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const p = this.page();
    this.title.setTitle(p.seo.title ?? p.title);
    if (p.seo.description) {
      this.meta.updateTag({ name: 'description', content: p.seo.description });
    }
    if (p.seo.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: p.seo.ogImage });
    }
    if (p.seo.noIndex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex' });
    } else {
      this.meta.removeTag('name="robots"');
    }
  }
}
