import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DOCUMENT, DatePipe, isPlatformBrowser } from '@angular/common';
import { of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { MarkdownComponent } from '@foliokit/cms-markdown';
import type { BlogPost, Tag, PostRouteData } from '@foliokit/cms-core';
import {
  TagService,
  BLOG_SEO_SERVICE,
  TagLabelPipe,
  resolvePostCanonicalUrl,
} from '@foliokit/cms-core';
import { FolioSkeletonComponent } from '../skeleton/folio-skeleton.component';

/** Unified shape for `toSignal` (avoids union branches that break overload inference). */
interface TagFetchState {
  readonly ready: boolean;
  readonly tags: Tag[];
}

interface PostShareLinks {
  readonly x: string;
  readonly facebook: string;
  readonly linkedin: string;
  readonly reddit: string;
  readonly bluesky: string;
  readonly email: string;
}

@Component({
  selector: 'folio-post-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, DatePipe, MarkdownComponent, TagLabelPipe, FolioSkeletonComponent],
  template: `
    <div
      class="px-4 md:px-6 py-8 lg:py-12"
      style="background: var(--bg); min-height: 100%"
    >
      <div class="max-w-[720px] mx-auto mb-6">
        <a
          routerLink="/posts"
          class="inline-flex items-center gap-1.5 text-sm transition-colors"
          style="color: var(--text-muted)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All posts
        </a>
      </div>

      @if (post() === null) {
        <div class="max-w-[720px] mx-auto text-center py-20">
          <p
            class="text-2xl font-semibold mb-4"
            style="font-family: var(--font-display); color: var(--text-primary)"
          >
            Post not found
          </p>
          <p class="mb-6" style="color: var(--text-muted)">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <a
            routerLink="/posts"
            class="inline-flex items-center gap-1.5 text-sm font-medium"
            style="color: var(--text-accent)"
          >
            ← Back to all posts
          </a>
        </div>
      } @else {
        <article class="max-w-[720px] mx-auto">
          <h1 class="post-title">
            {{ post()!.title }}
          </h1>

          @if (post()!.subtitle) {
            <p class="folio-post-subtitle">{{ post()!.subtitle }}</p>
          }

          <div class="flex flex-wrap items-start gap-x-3 gap-y-2 mb-8 justify-between">
            <div class="post-meta flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0 flex-1">
              @if (author()?.displayName) {
                <span style="color: var(--text-secondary); font-weight: 500">
                  {{ author()!.displayName }}
                </span>
                <span aria-hidden="true">·</span>
              }
              @if (post()!.publishedAt) {
                <time [dateTime]="publishedDate()!.toISOString()">
                  {{ publishedDate() | date: 'MMMM d, yyyy' }}
                </time>
              }
              @if (post()!.readingTimeMinutes) {
                <span aria-hidden="true">·</span>
                <span>{{ post()!.readingTimeMinutes }} min read</span>
              }
              @if (post()!.tags.length) {
                @if (tagsReady()) {
                  <span aria-hidden="true">·</span>
                  <div class="flex flex-wrap gap-1.5">
                    @for (tag of post()!.tags; track tag) {
                      <a
                        [routerLink]="['/posts']"
                        [queryParams]="{ tag: tag }"
                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors"
                        style="background-color: color-mix(in srgb, var(--text-accent) 12%, transparent); color: var(--text-accent)"
                      >
                        {{ tag | tagLabel: tagLookup() }}
                      </a>
                    }
                  </div>
                } @else {
                  <span aria-hidden="true">·</span>
                  <div class="flex flex-wrap gap-1.5">
                    <folio-skeleton width="3rem" height="1.25rem" borderRadius="9999px" />
                    <folio-skeleton width="4rem" height="1.25rem" borderRadius="9999px" />
                    <folio-skeleton width="3.5rem" height="1.25rem" borderRadius="9999px" />
                  </div>
                }
              }
            </div>

            @if (postShareLinks(); as sl) {
              <details #shareDetails class="share-menu shrink-0">
                <summary
                  class="share-menu-trigger inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors"
                  style="color: var(--text-accent)"
                  aria-label="Share this post"
                >
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z" />
                  </svg>
                  Share
                </summary>
                <div class="share-menu-panel" role="menu">
                  <a class="share-menu-item" [href]="sl.x" target="_blank" rel="noopener noreferrer" role="menuitem">X (Twitter)</a>
                  <a class="share-menu-item" [href]="sl.facebook" target="_blank" rel="noopener noreferrer" role="menuitem">Facebook</a>
                  <a class="share-menu-item" [href]="sl.linkedin" target="_blank" rel="noopener noreferrer" role="menuitem">LinkedIn</a>
                  <a class="share-menu-item" [href]="sl.reddit" target="_blank" rel="noopener noreferrer" role="menuitem">Reddit</a>
                  <a class="share-menu-item" [href]="sl.bluesky" target="_blank" rel="noopener noreferrer" role="menuitem">Bluesky</a>
                  <a class="share-menu-item" [href]="sl.email" role="menuitem">Email</a>
                  <button type="button" class="share-menu-item" role="menuitem" (click)="copyShareLink()">Copy link</button>
                </div>
              </details>
            }
          </div>

          <div class="surface-card mt-6 p-6 md:p-10">

            @if (post()!.thumbnailUrl) {
              <div
                class="w-full overflow-hidden rounded-[var(--r-lg)]"
                style="aspect-ratio: 16/9; max-height: 480px"
              >
                <img
                  [src]="post()!.thumbnailUrl"
                  [alt]="post()!.thumbnailAlt || post()!.title"
                  class="w-full h-full object-cover"
                />
              </div>
            }

            <div class="mt-8 folio-prose">
              <folio-markdown
                [content]="post()!.content"
                [embeddedMedia]="post()!.embeddedMedia"
              />
            </div>

          </div>
        </article>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .surface-card {
      background: var(--surface-0);
      border-radius: var(--r-2xl);
      box-shadow: var(--shadow-sm);
    }

    .folio-post-subtitle {
      font-family: var(--font-display);
      font-style: italic;
      font-size: 1.125rem;
      line-height: 1.6;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .post-title {
      font-family: var(--font-display);
      font-size: clamp(1.7rem, 3.5vw, 2.7rem);
      font-weight: 700;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    .post-meta {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .share-menu {
      position: relative;
    }

    .share-menu summary {
      cursor: pointer;
      list-style: none;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 500;
    }

    .share-menu summary::-webkit-details-marker {
      display: none;
    }

    .share-menu-trigger:hover {
      background: color-mix(in srgb, var(--text-accent) 10%, transparent);
    }

    .share-menu-panel {
      position: absolute;
      right: 0;
      top: calc(100% + 4px);
      min-width: 11rem;
      padding: 0.375rem 0;
      background: var(--surface-0);
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-sm);
      border: 1px solid color-mix(in srgb, var(--text-muted) 22%, transparent);
      z-index: 20;
    }

    .share-menu-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: 0.5rem 0.75rem;
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-decoration: none;
      border: none;
      background: transparent;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .share-menu-item:hover {
      background: color-mix(in srgb, var(--text-accent) 8%, transparent);
      color: var(--text-primary);
    }
  `],
})
export class BlogPostDetailComponent implements OnInit {
  @ViewChild('shareDetails') private shareDetails?: ElementRef<HTMLDetailsElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly tagService = inject(TagService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly blogSeoService = inject(BLOG_SEO_SERVICE, { optional: true });
  private readonly document = inject(DOCUMENT);

  /** Browser-only fetch: SSR keeps `ready: false` so hydrated DOM matches (tags appear after load). */
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

  private readonly routeData = computed(
    () => this.route.snapshot.data['post'] as PostRouteData,
  );

  protected readonly post = computed(() => this.routeData()?.post ?? null);

  protected readonly author = computed(() => this.routeData()?.author ?? null);

  protected readonly publishedDate = computed(() => {
    const p = this.post();
    return p ? new Date(p.publishedAt) : null;
  });

  private readonly originBase = (): string =>
    this.document.location?.origin ?? 'https://blog.foliokitcms.com';

  protected readonly sharePageUrl = computed(() => {
    const p = this.post();
    if (!p) return '';
    return resolvePostCanonicalUrl(p, this.originBase());
  });

  protected readonly postShareLinks = computed((): PostShareLinks | null => {
    const p = this.post();
    const pageUrl = this.sharePageUrl();
    if (!p || !pageUrl) return null;
    const title = p.title;
    const encUrl = encodeURIComponent(pageUrl);
    const encTitle = encodeURIComponent(title);
    const blueskyText = encodeURIComponent(`${title} ${pageUrl}`);
    const body = encodeURIComponent(`${title}\n\n${pageUrl}`);
    return {
      x: `https://twitter.com/intent/tweet?text=${encTitle}&url=${encUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encUrl}`,
      reddit: `https://www.reddit.com/submit?url=${encUrl}&title=${encTitle}`,
      bluesky: `https://bsky.app/intent/compose?text=${blueskyText}`,
      email: `mailto:?subject=${encTitle}&body=${body}`,
    };
  });

  protected async copyShareLink(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const url = this.sharePageUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy link:', url);
    }
    this.shareDetails?.nativeElement.removeAttribute('open');
  }

  ngOnInit(): void {
    const p = this.post();
    if (!p) return;
    this.blogSeoService?.setPostMeta(p, this.originBase(), this.author()?.displayName);
  }

  constructor() {
    effect(() => {
      if (!isPlatformBrowser(this.platformId)) return;
      const p = this.post();
      if (!p) return;
      this.blogSeoService?.setPostMeta(p, this.originBase(), this.author()?.displayName);
    });
  }
}
