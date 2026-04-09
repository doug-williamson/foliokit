import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { take } from 'rxjs/operators';
import { map } from 'rxjs';
import type { Series } from '@foliokit/cms-core';
import { BLOG_SEO_SERVICE, SiteConfigService } from '@foliokit/cms-core';

@Component({
  selector: 'folio-series-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, NgTemplateOutlet],
  styles: [':host { display: block; background: var(--bg); min-height: 100%; }'],
  template: `
    <div class="w-full max-w-[900px] mx-auto px-4 md:px-6 py-8 lg:py-12">
      <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">Series</h1>
      <p class="text-sm mb-8" style="color: var(--text-muted)">Structured sequences of posts.</p>

      @if (activeSeries().length === 0) {
        <p class="text-sm" style="color: var(--text-muted)">No series published yet.</p>
      } @else {
        <div class="flex flex-col gap-3">
          @for (s of activeSeries(); track s.id) {
            <ng-container
              [ngTemplateOutlet]="seriesCard"
              [ngTemplateOutletContext]="{ $implicit: s }"
            />
          }
        </div>
      }
    </div>

    <ng-template #seriesCard let-s>
      <a
        [routerLink]="['/series', s.slug]"
        class="block border rounded-xl p-4 no-underline"
        style="border-color: var(--border); background: var(--surface-0); transition: box-shadow 0.15s, transform 0.15s;"
        onmouseenter="this.style.boxShadow='var(--shadow-md)';this.style.transform='translateY(-1px)'"
        onmouseleave="this.style.boxShadow='';this.style.transform=''"
      >
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-base font-semibold" style="color: var(--text-primary)">{{ s.name }}</h3>
          <span class="text-xs shrink-0 mt-0.5" style="color: var(--text-muted)">
            {{ s.postCount }} {{ s.postCount === 1 ? 'post' : 'posts' }}
          </span>
        </div>
        @if (s.description) {
          <p class="text-sm mt-1" style="color: var(--text-secondary)">{{ s.description }}</p>
        }
      </a>
    </ng-template>
  `,
})
export class SeriesListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly blogSeoService = inject(BLOG_SEO_SERVICE, { optional: true });
  private readonly document = inject(DOCUMENT);

  readonly series = toSignal(
    this.route.data.pipe(map((d) => (d['series'] as Series[]) ?? [])),
    { initialValue: (this.route.snapshot.data['series'] as Series[]) ?? [] },
  );

  protected readonly activeSeries = computed(() =>
    this.series().filter((s) => s.isActive),
  );

  private readonly siteConfig = toSignal(
    this.siteConfigService.getDefaultSiteConfig().pipe(take(1)),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const config = this.siteConfig();
      if (!config) return;
      const name = config.siteName ?? 'Blog';
      this.titleService.setTitle(`Series — ${name}`);
      const baseUrl = this.document.location?.origin ?? '';
      this.blogSeoService?.setDefaultMeta(config, `${baseUrl}/series`);
    });
  }
}
