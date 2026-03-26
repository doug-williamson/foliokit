import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import type { BlogPost, Tag } from '@foliokit/cms-core';
import { SiteConfigService, TagService } from '@foliokit/cms-core';
import { BlogSeoService } from '../../services/blog-seo.service';
import { PostCardComponent } from './post-card.component';
import { TagFilterComponent } from './tag-filter.component';

@Component({
  selector: 'app-post-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [PostCardComponent, TagFilterComponent],
  template: `
    <div
      class="px-4 md:px-6 lg:px-8 py-8 lg:py-12 flex-1 flex flex-col"
      [style.max-width]="'1280px'"
      style="margin-inline: auto"
    >
      <!-- Tag filter -->
      @if (allTagOptions().length > 0) {
        <div class="mb-8" [style.padding-bottom]="'0.5rem'">
          <app-tag-filter
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
        <!-- ── Desktop: hero slot (first post, lg+ only) ─────────────────── -->
        <div class="hidden lg:block mb-10">
          <app-post-card [post]="filteredPosts()[0]" variant="hero" />
        </div>

        <!-- ── Card grid ─────────────────────────────────────────────────── -->
        <!--
          Mobile:  1 col, all posts (incl. first) as stacked cards
          Tablet:  1 col, all posts (card uses horizontal thumbnail-left layout)
          Desktop: 3 col grid, first post hidden here (shown in hero slot above)
        -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          @for (post of filteredPosts(); track post.id; let i = $index) {
            <div [class]="i === 0 ? 'lg:hidden' : ''">
              <app-post-card [post]="post" />
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [':host { display: flex; flex-direction: column; background: var(--bg); min-height: 100%; }'],
})
export class PostListComponent implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tagService = inject(TagService);
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly blogSeoService = inject(BlogSeoService);
  private readonly document = inject(DOCUMENT);

  private readonly siteConfig = toSignal(
    this.siteConfigService.getDefaultSiteConfig().pipe(take(1)),
    { initialValue: null },
  );

  @ViewChild('tagFilter') private tagFilterRef?: TagFilterComponent;

  protected readonly posts = signal<BlogPost[]>(
    this.route.snapshot.data['posts'] as BlogPost[],
  );

  protected readonly selectedTag = signal<string | null>(
    (this.route.snapshot.queryParamMap.get('tag') ?? null),
  );

  private readonly fetchedTags = toSignal(
    this.tagService.getAllTags().pipe(take(1)),
    { initialValue: [] as Tag[] },
  );

  private readonly tagLookup = computed(
    () => new Map(this.fetchedTags().map((t) => [t.id, t])),
  );

  protected readonly allTagOptions = computed<Tag[]>(() => {
    const lookup = this.tagLookup();
    const seen = new Set<string>();
    const options: Tag[] = [];
    for (const post of this.posts()) {
      for (const id of post.tags) {
        if (!seen.has(id)) {
          seen.add(id);
          options.push(lookup.get(id) ?? { id, label: id, slug: id });
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
      this.blogSeoService.setDefaultMeta(config, `${baseUrl}/posts`);
    });
  }

  ngAfterViewInit(): void {
    const initial = this.selectedTag();
    if (initial) {
      this.tagFilterRef?.setActive(initial);
    }
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
