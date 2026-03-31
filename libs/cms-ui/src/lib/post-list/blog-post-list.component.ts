import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import type { BlogPost, Tag } from '@foliokit/cms-core';
import {
  SiteConfigService,
  TagService,
  BLOG_SEO_SERVICE,
  buildPageTitle,
  tagIdFallbackLabel,
} from '@foliokit/cms-core';
import { BlogPostCardComponent } from './blog-post-card.component';
import { BlogTagFilterComponent } from './blog-tag-filter.component';

/** Unified shape for `toSignal` (avoids union branches that break overload inference). */
interface TagFetchState {
  readonly ready: boolean;
  readonly tags: Tag[];
}

@Component({
  selector: 'folio-post-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [BlogPostCardComponent, BlogTagFilterComponent],
  template: `
    <div
      class="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex flex-col"
    >
      @if (tagsReady() && allTagOptions().length > 0) {
        <div class="mb-8" [style.padding-bottom]="'0.5rem'">
          <folio-tag-filter
            #tagFilter
            [tags]="allTagOptions()"
            (tagSelected)="onTagSelected($event)"
          />
        </div>
      }

      @if (filteredPosts().length === 0) {
        <div
          class="flex-1 flex items-center justify-center"
          style="color: var(--text-muted)"
        >
          <p class="text-xl">No posts found{{ selectedTag() ? ' for tag "' + selectedTag() + '"' : '' }}.</p>
        </div>
      } @else {
        <div class="hidden lg:block mb-10">
          <folio-post-card
            [post]="filteredPosts()[0]"
            variant="hero"
            [tagLabelsReady]="tagsReady()"
            [tagLookupForLabels]="tagLookup()"
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          @for (post of filteredPosts(); track post.id; let i = $index) {
            <div [class]="i === 0 ? 'lg:hidden' : ''">
              <folio-post-card
                [post]="post"
                [tagLabelsReady]="tagsReady()"
                [tagLookupForLabels]="tagLookup()"
              />
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [':host { display: flex; flex-direction: column; background: var(--bg); min-height: 100%; }'],
})
export class BlogPostListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly tagService = inject(TagService);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly blogSeoService = inject(BLOG_SEO_SERVICE, { optional: true });
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);

  private readonly siteConfig = toSignal(
    this.siteConfigService.getDefaultSiteConfig().pipe(take(1)),
    { initialValue: null },
  );

  @ViewChild('tagFilter') private tagFilterRef?: BlogTagFilterComponent;

  protected readonly posts = signal<BlogPost[]>(
    this.route.snapshot.data['posts'] as BlogPost[],
  );

  protected readonly selectedTag = signal<string | null>(
    (this.route.snapshot.queryParamMap.get('tag') ?? null),
  );

  /** Browser-only fetch so SSR stays `ready: false` and hydration matches (no tag strip on server). */
  private readonly tagFetchState = toSignal(
    isPlatformBrowser(this.platformId)
      ? this.tagService.getAllTags().pipe(
          take(1),
          map((tags): TagFetchState => ({ ready: true, tags })),
        )
      : of<TagFetchState>({ ready: false, tags: [] }),
    { initialValue: { ready: false, tags: [] } satisfies TagFetchState },
  );

  protected readonly tagsReady = computed(() => this.tagFetchState()?.ready ?? false);

  protected readonly tagLookup = computed(
    () =>
      new Map((this.tagFetchState()?.tags ?? []).map((t) => [t.id, t])),
  );

  protected readonly allTagOptions = computed<Tag[]>(() => {
    if (!this.tagsReady()) return [];
    const lookup = this.tagLookup();
    const seen = new Set<string>();
    const options: Tag[] = [];
    for (const post of this.posts()) {
      for (const id of post.tags) {
        if (!seen.has(id)) {
          seen.add(id);
          options.push(
            lookup.get(id) ?? { id, label: tagIdFallbackLabel(id), slug: id },
          );
        }
      }
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  });

  protected readonly filteredPosts = computed(() => {
    const tag = this.selectedTag();
    if (!tag) return this.posts();
    return this.posts().filter((p) => p.tags.includes(tag));
  });

  constructor() {
    effect(() => {
      const config = this.siteConfig();
      if (!config) return;
      const baseUrl = this.document.location?.origin ?? 'https://blog.foliokitcms.com';
      this.blogSeoService?.setDefaultMeta(config, `${baseUrl}/posts`);
    });

    effect(() => {
      if (!this.siteConfig()) return;
      const tag = this.selectedTag();
      this.titleService.setTitle(tag ? buildPageTitle(`#${tag}`) : buildPageTitle('Blog'));
    });

    effect(() => {
      if (!this.tagsReady() || !this.allTagOptions().length) return;
      const initial = this.selectedTag();
      if (!initial) return;
      afterNextRender(
        () => {
          this.tagFilterRef?.setActive(initial);
        },
        { injector: this.injector },
      );
    });
  }

  protected onTagSelected(tag: string | null): void {
    this.selectedTag.set(tag);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tag: tag ?? undefined },
      queryParamsHandling: 'merge',
    });
  }
}
