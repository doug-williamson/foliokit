import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import type { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'app-post-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    @if (variant() === 'hero') {
      <div
        class="hero-card block relative w-full overflow-hidden rounded-[var(--folio-blog-radius-card)] group"
        [style.box-shadow]="'var(--folio-blog-shadow-card)'"
      >
        <a
          [routerLink]="['/posts', post().slug]"
          class="absolute inset-0 z-10"
          [attr.aria-label]="post().title"
        ></a>
        <div class="relative w-full" [style.padding-bottom]="'var(--folio-blog-hero-aspect)'">
          @if (post().thumbnailUrl) {
            <img
              [src]="post().thumbnailUrl"
              [alt]="post().thumbnailAlt || post().title"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          } @else {
            <div
              class="absolute inset-0 w-full h-full"
              style="background-color: color-mix(in srgb, var(--folio-blog-accent) 18%, var(--folio-blog-surface-raised))"
            ></div>
          }
          <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            @if (firstTwoTags().length > 0) {
              <div class="flex flex-wrap gap-1.5 mb-3">
                @for (tag of firstTwoTags(); track tag) {
                  <a
                    [routerLink]="['/posts']"
                    [queryParams]="{ tag: tag }"
                    class="relative z-20 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm hover:bg-white/30 transition-colors"
                  >
                    {{ tag }}
                  </a>
                }
              </div>
            }
            <h2
              class="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3"
              style="font-family: var(--folio-blog-font-serif)"
            >
              {{ post().title }}
            </h2>
            <div class="flex items-center gap-2 text-sm text-white/75">
              <time [dateTime]="publishedDate().toISOString()">
                {{ publishedDate() | date: 'MMM d, yyyy' }}
              </time>
              @if (post().readingTimeMinutes) {
                <span>·</span>
                <span>{{ post().readingTimeMinutes }} min read</span>
              }
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div
        class="card-link group relative flex flex-col md:flex-row lg:flex-col h-full overflow-hidden rounded-[var(--folio-blog-radius-card)] transition-all duration-200"
        [style.background]="'var(--folio-blog-surface-raised)'"
        [style.box-shadow]="'var(--folio-blog-shadow-card)'"
        [style.border]="'1px solid var(--folio-blog-border)'"
      >
        <a
          [routerLink]="['/posts', post().slug]"
          class="absolute inset-0 z-10"
          [attr.aria-label]="post().title"
        ></a>
        <div
          class="relative w-full flex-shrink-0 overflow-hidden
                 md:w-[280px] md:self-stretch
                 lg:w-full"
        >
          <div
            class="relative w-full"
            style="padding-bottom: var(--folio-blog-card-aspect)"
          >
            @if (post().thumbnailUrl) {
              <img
                [src]="post().thumbnailUrl"
                [alt]="post().thumbnailAlt || post().title"
                class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            } @else {
              <div
                class="absolute inset-0 w-full h-full flex items-center justify-center"
                style="background-color: color-mix(in srgb, var(--folio-blog-accent) 12%, var(--folio-blog-surface-raised))"
              >
                <svg
                  class="w-10 h-10 opacity-30"
                  style="color: var(--folio-blog-accent)"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
            }
          </div>
        </div>
        <div class="flex flex-col flex-1 p-4 md:p-5">
          @if (firstTwoTags().length > 0) {
            <div class="flex flex-wrap gap-1.5 mb-2.5">
              @for (tag of firstTwoTags(); track tag) {
                <a
                  [routerLink]="['/posts']"
                  [queryParams]="{ tag: tag }"
                  class="relative z-20 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors"
                  style="background-color: color-mix(in srgb, var(--folio-blog-accent) 12%, transparent); color: var(--folio-blog-accent)"
                >
                  {{ tag }}
                </a>
              }
            </div>
          }
          <h2
            class="text-base font-semibold leading-snug mb-2 group-hover:underline decoration-1 underline-offset-2 flex-grow-0"
            style="font-family: var(--folio-blog-font-serif); color: var(--folio-blog-text-primary)"
          >
            {{ post().title }}
          </h2>
          @if (post().excerpt) {
            <p
              class="text-sm line-clamp-3 mb-3 flex-1"
              style="color: var(--folio-blog-text-secondary)"
            >
              {{ post().excerpt }}
            </p>
          }
          <div
            class="flex items-center gap-1.5 text-xs mt-auto"
            style="color: var(--folio-blog-text-muted)"
          >
            <time [dateTime]="publishedDate().toISOString()">
              {{ publishedDate() | date: 'MMM d, yyyy' }}
            </time>
            @if (post().readingTimeMinutes) {
              <span>·</span>
              <span>{{ post().readingTimeMinutes }} min read</span>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .card-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px 0 rgb(0 0 0 / 0.12), 0 8px 24px 0 rgb(0 0 0 / 0.08) !important;
    }

    /* On tablet the thumbnail height matches the content column via align-self: stretch */
    @media (min-width: 768px) and (max-width: 1023px) {
      .card-link .relative[style*='padding-bottom'] {
        padding-bottom: 0 !important;
        height: 100%;
      }
    }
  `],
})
export class PostCardComponent {
  readonly post = input.required<BlogPost>();
  readonly variant = input<'hero' | 'card'>('card');

  protected readonly publishedDate = computed(() => new Date(this.post().publishedAt));
  protected readonly firstTwoTags = computed(() => this.post().tags.slice(0, 2));
}
