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
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { forkJoin, of, type Observable } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import type { Author, BlogPost, Tag } from '@foliokit/cms-core';
import {
  AUTHOR_SERVICE,
  SiteConfigService,
  TagService,
  BLOG_SEO_SERVICE,
  buildPageTitle,
  tagIdFallbackLabel,
} from '@foliokit/cms-core';
import { FolioSkeletonComponent } from '../skeleton/folio-skeleton.component';
import { BlogPostCardComponent } from './blog-post-card.component';
import { BlogTagFilterComponent } from './blog-tag-filter.component';

/** Unified shape for `toSignal` (avoids union branches that break overload inference). */
interface TagFetchState {
  readonly ready: boolean;
  readonly tags: Tag[];
}

interface AuthorFetchState {
  readonly ready: boolean;
  readonly byId: Map<string, Author | null>;
}

@Component({
  selector: 'folio-post-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [BlogPostCardComponent, BlogTagFilterComponent, FolioSkeletonComponent],
  template: `
    <div
      class="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex flex-col"
    >
      @if (!tagsReady() && postsHaveTags()) {
        <div class="mb-8 flex flex-wrap gap-2" [style.padding-bottom]="'0.5rem'">
          <folio-skeleton width="3.25rem" height="2.125rem" borderRadius="9999px" />
          <folio-skeleton width="4.5rem" height="2.125rem" borderRadius="9999px" />
          <folio-skeleton width="3.75rem" height="2.125rem" borderRadius="9999px" />
          <folio-skeleton width="5rem" height="2.125rem" borderRadius="9999px" />
          <folio-skeleton width="3.5rem" height="2.125rem" borderRadius="9999px" />
        </div>
      }
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
          @let hero = filteredPosts()[0];
          <folio-post-card
            [post]="hero"
            variant="hero"
            [authorsReady]="authorsReady()"
            [authorName]="authorDisplayName(hero)"
            [authorPhotoUrl]="authorPhotoUrl(hero)"
            [tagLabelsReady]="tagsReady()"
            [tagLookupForLabels]="tagLookup()"
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          @for (post of filteredPosts(); track post.id; let i = $index) {
            <div [class]="i === 0 ? 'lg:hidden' : ''">
              <folio-post-card
                [post]="post"
                [authorsReady]="authorsReady()"
                [authorName]="authorDisplayName(post)"
                [authorPhotoUrl]="authorPhotoUrl(post)"
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
  private readonly authorService = inject(AUTHOR_SERVICE, { optional: true });
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

  /**
   * Browser: resolve authors for post `authorId`s (or ready with empty map when no service).
   * SSR: `ready: false` until hydration (matches tag label pattern).
   */
  private readonly authorFetchState = toSignal(
    !isPlatformBrowser(this.platformId)
      ? of<AuthorFetchState>({ ready: false, byId: new Map() })
      : !this.authorService
        ? toObservable(this.posts).pipe(
            map((): AuthorFetchState => ({ ready: true, byId: new Map() })),
          )
        : toObservable(this.posts).pipe(
            switchMap((list) => {
              const ids = [
                ...new Set(
                  list
                    .map((p) => p.authorId)
                    .filter((id): id is string => typeof id === 'string' && id.length > 0),
                ),
              ];
              if (!ids.length) {
                return of<AuthorFetchState>({ ready: true, byId: new Map() });
              }
              const sources = Object.fromEntries(
                ids.map((id) => [
                  id,
                  this.authorService!.getById(id).pipe(take(1)),
                ]),
              ) as Record<string, Observable<Author | null>>;
              return forkJoin(sources).pipe(
                map((record): AuthorFetchState => {
                  const byId = new Map<string, Author | null>();
                  for (const [id, a] of Object.entries(record)) {
                    byId.set(id, a);
                  }
                  return { ready: true, byId };
                }),
              );
            }),
          ),
    { initialValue: { ready: false, byId: new Map() } satisfies AuthorFetchState },
  );

  protected readonly authorsReady = computed(() => this.authorFetchState().ready);

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

  protected readonly postsHaveTags = computed(() =>
    this.posts().some((p) => p.tags.length > 0),
  );

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

  protected authorDisplayName(post: BlogPost): string | null {
    const st = this.authorFetchState();
    if (!st.ready || !post.authorId) return null;
    const n = st.byId.get(post.authorId)?.displayName?.trim();
    return n || null;
  }

  protected authorPhotoUrl(post: BlogPost): string | null {
    const st = this.authorFetchState();
    if (!st.ready || !post.authorId) return null;
    const u = st.byId.get(post.authorId)?.photoUrl?.trim();
    return u || null;
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
