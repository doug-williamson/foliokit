import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { map, take } from 'rxjs/operators';
import type { BlogPost, Series } from '@foliokit/cms-core';
import { BLOG_SEO_SERVICE, PostService, SiteConfigService } from '@foliokit/cms-core';
import { BlogPostCardComponent } from '../post-list/blog-post-card.component';
import { NotFoundComponent } from '../not-found/not-found.component';

@Component({
  selector: 'folio-series-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BlogPostCardComponent, NotFoundComponent],
  styles: [':host { display: block; background: var(--bg); min-height: 100%; }'],
  template: `
    @if (!series() || !series()!.isActive) {
      <folio-not-found />
    } @else {
      <div class="w-full max-w-[900px] mx-auto px-4 md:px-6 py-8 lg:py-12">
        <!-- Breadcrumb -->
        <nav class="text-sm mb-4" style="color: var(--text-muted)">
          <a routerLink="/series" style="color: var(--text-accent); text-decoration: none">Series</a>
        </nav>

        <!-- Header -->
        <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">
          {{ series()!.name }}
        </h1>
        @if (series()!.description) {
          <p class="text-base mb-8" style="color: var(--text-secondary)">
            {{ series()!.description }}
          </p>
        }

        <!-- Posts -->
        @if (postsLoading()) {
          <p class="text-sm" style="color: var(--text-muted)">Loading posts…</p>
        } @else if (posts().length === 0) {
          <p class="text-sm" style="color: var(--text-muted)">No posts in this series yet.</p>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (post of posts(); track post.id) {
              <folio-post-card [post]="post" [authorsReady]="true" />
            }
          </div>
        }
      </div>
    }
  `,
})
export class SeriesDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly postService = inject(PostService);
  private readonly blogSeoService = inject(BLOG_SEO_SERVICE, { optional: true });
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly series = toSignal(
    this.route.data.pipe(map((d) => (d['series'] as Series | null) ?? null)),
    { initialValue: (this.route.snapshot.data['series'] as Series | null) ?? null },
  );

  protected readonly posts = signal<BlogPost[]>([]);
  protected readonly postsLoading = signal(false);

  private readonly siteConfig = toSignal(
    this.siteConfigService.getDefaultSiteConfig().pipe(take(1)),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const s = this.series();
      if (!s || !s.isActive) return;
      if (!isPlatformBrowser(this.platformId)) return;
      this.postsLoading.set(true);
      this.postService
        .getBySeriesId(s.id)
        .pipe(take(1))
        .subscribe({
          next: (posts) => {
            this.posts.set(posts);
            this.postsLoading.set(false);
          },
          error: () => this.postsLoading.set(false),
        });
    });

    effect(() => {
      const s = this.series();
      const config = this.siteConfig();
      if (!s || !s.isActive) return;
      const name = config?.siteName ?? 'Blog';
      this.titleService.setTitle(`${s.name} — ${name}`);
      if (config) {
        const baseUrl = this.document.location?.origin ?? '';
        this.blogSeoService?.setDefaultMeta(config, `${baseUrl}/series/${s.slug}`);
      }
    });
  }
}
