import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { MarkdownComponent } from '@foliokit/cms-markdown';
import type { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'app-post-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, DatePipe, MarkdownComponent],
  template: `
    <div
      class="px-4 md:px-6 py-8 lg:py-12"
      style="background: var(--folio-blog-surface); min-height: 100%"
    >
      <!-- Back link -->
      <div class="max-w-[720px] mx-auto mb-6">
        <a
          routerLink="/posts"
          class="inline-flex items-center gap-1.5 text-sm transition-colors"
          style="color: var(--folio-blog-text-muted)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All posts
        </a>
      </div>

      @if (post() === null) {
        <!-- ── 404 state ─────────────────────────────────────────────────── -->
        <div class="max-w-[720px] mx-auto text-center py-20">
          <p
            class="text-2xl font-semibold mb-4"
            style="font-family: var(--folio-blog-font-serif); color: var(--folio-blog-text-primary)"
          >
            Post not found
          </p>
          <p class="mb-6" style="color: var(--folio-blog-text-muted)">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <a
            routerLink="/posts"
            class="inline-flex items-center gap-1.5 text-sm font-medium"
            style="color: var(--folio-blog-accent)"
          >
            ← Back to all posts
          </a>
        </div>
      } @else {
        <!-- ── Article ────────────────────────────────────────────────────── -->
        <article class="max-w-[720px] mx-auto">
          <!-- Title -->
          <h1
            class="text-3xl md:text-4xl font-bold leading-tight mb-3"
            style="font-family: var(--folio-blog-font-serif); color: var(--folio-blog-text-primary)"
          >
            {{ post()!.title }}
          </h1>

          <!-- Subtitle -->
          @if (post()!.subtitle) {
            <p
              class="text-lg md:text-xl leading-relaxed mb-5"
              style="color: var(--folio-blog-text-secondary)"
            >
              {{ post()!.subtitle }}
            </p>
          }

          <!-- Meta row -->
          <div
            class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm mb-8"
            style="color: var(--folio-blog-text-muted)"
          >
            @if (post()!.authorId) {
              <span style="color: var(--folio-blog-text-secondary); font-weight: 500">
                {{ post()!.authorId }}
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
              <span aria-hidden="true">·</span>
              <div class="flex flex-wrap gap-1.5">
                @for (tag of post()!.tags; track tag) {
                  <a
                    [routerLink]="['/posts']"
                    [queryParams]="{ tag: tag }"
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors"
                    style="background-color: color-mix(in srgb, var(--folio-blog-accent) 12%, transparent); color: var(--folio-blog-accent)"
                  >
                    {{ tag }}
                  </a>
                }
              </div>
            }
          </div>

          <!-- Thumbnail -->
          @if (post()!.thumbnailUrl) {
            <div
              class="w-full mb-8 overflow-hidden rounded-[var(--folio-blog-radius-card)]"
              style="aspect-ratio: 16/9; max-height: 480px"
            >
              <img
                [src]="post()!.thumbnailUrl"
                [alt]="post()!.thumbnailAlt || post()!.title"
                class="w-full h-full object-cover"
              />
            </div>
          }

          <!-- Divider -->
          <hr style="border-color: var(--folio-blog-border); margin-bottom: 2rem" />

          <!-- Article body -->
          <div class="folio-prose">
            <folio-markdown
              [content]="post()!.content"
              [embeddedMedia]="post()!.embeddedMedia"
            />
          </div>
        </article>
      }
    </div>
  `,
  styles: [':host { display: block; }'],
})
export class PostDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  protected readonly post = computed(
    () => this.route.snapshot.data['post'] as BlogPost | null,
  );

  protected readonly publishedDate = computed(() => {
    const p = this.post();
    return p ? new Date(p.publishedAt) : null;
  });

  constructor() {
    effect(() => {
      const p = this.post();
      if (!p) return;

      const pageTitle = p.seo?.title ?? p.title;
      const description = p.seo?.description ?? p.excerpt ?? '';
      const ogImage = p.seo?.ogImage ?? p.thumbnailUrl ?? '';

      this.titleService.setTitle(pageTitle);
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:title', content: pageTitle });
      this.meta.updateTag({ property: 'og:description', content: description });
      if (ogImage) {
        this.meta.updateTag({ property: 'og:image', content: ogImage });
      }
    });
  }
}
