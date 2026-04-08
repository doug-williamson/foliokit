import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import type { Pillar, Series } from '@foliokit/cms-core';
import { BLOG_SEO_SERVICE, SeriesService, SiteConfigService } from '@foliokit/cms-core';

@Component({
  selector: 'folio-pillars-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styles: [':host { display: block; background: var(--bg); min-height: 100%; }'],
  template: `
    <div class="w-full max-w-[900px] mx-auto px-4 md:px-6 py-8 lg:py-12">
      <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">Pillars</h1>
      <p class="text-sm mb-8" style="color: var(--text-muted)">
        Content pillars organise series into broad topic areas.
      </p>

      @if (pillars().length === 0) {
        <p class="text-sm" style="color: var(--text-muted)">No pillars published yet.</p>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (pillar of pillars(); track pillar.id) {
            <a
              [routerLink]="['/pillars', pillar.slug]"
              class="block border rounded-xl p-5 no-underline"
              style="border-color: var(--border); background: var(--surface-0); transition: box-shadow 0.15s, transform 0.15s;"
              onmouseenter="this.style.boxShadow='var(--shadow-md)';this.style.transform='translateY(-1px)'"
              onmouseleave="this.style.boxShadow='';this.style.transform=''"
            >
              <h2 class="text-lg font-semibold mb-1" style="color: var(--text-primary)">
                {{ pillar.name }}
              </h2>
              @if (pillar.description) {
                <p class="text-sm mb-3" style="color: var(--text-secondary)">{{ pillar.description }}</p>
              }
              <span class="text-xs" style="color: var(--text-muted)">
                {{ seriesCountFor(pillar.id) }} series
              </span>
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class PillarsListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly seriesService = inject(SeriesService);
  private readonly blogSeoService = inject(BLOG_SEO_SERVICE, { optional: true });
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly pillars = toSignal(
    this.route.data.pipe(map((d) => (d['pillars'] as Pillar[]) ?? [])),
    { initialValue: (this.route.snapshot.data['pillars'] as Pillar[]) ?? [] },
  );

  private readonly allSeries = toSignal(
    isPlatformBrowser(this.platformId)
      ? this.seriesService.getAll().pipe(
          take(1),
          map((list) => list.filter((s) => s.isActive)),
        )
      : of<Series[]>([]),
    { initialValue: [] },
  );

  private readonly seriesCountByPillar = computed((): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const s of this.allSeries()) {
      if (s.pillarId !== null) {
        counts[s.pillarId] = (counts[s.pillarId] ?? 0) + 1;
      }
    }
    return counts;
  });

  protected seriesCountFor(pillarId: string): number {
    return this.seriesCountByPillar()[pillarId] ?? 0;
  }

  private readonly siteConfig = toSignal(
    this.siteConfigService.getDefaultSiteConfig().pipe(take(1)),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const config = this.siteConfig();
      if (!config) return;
      const name = config.siteName ?? 'Blog';
      this.titleService.setTitle(`Pillars — ${name}`);
      const baseUrl = this.document.location?.origin ?? '';
      this.blogSeoService?.setDefaultMeta(config, `${baseUrl}/pillars`);
    });
  }
}
