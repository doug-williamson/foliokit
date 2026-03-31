import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Tag } from '@foliokit/cms-core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import type { BlogPost } from '@foliokit/cms-core';
import { TagLabelPipe } from '@foliokit/cms-core';

@Component({
  selector: 'folio-post-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, DatePipe, TagLabelPipe],
  styles: [`
    :host { display: block; height: 100%; }

    .card {
      background: var(--surface-0);
      border: 1px solid var(--border);
      border-radius: var(--r-xl);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      transition: box-shadow 0.18s, transform 0.18s;

      &:hover {
        box-shadow: var(--shadow-lg);
        transform: translateY(-2px);
      }
    }

    .card-link-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
    }

    .card-thumb {
      width: 100%;
      aspect-ratio: 16 / 9;
      max-height: 200px;
      object-fit: cover;
      display: block;
      flex-shrink: 0;
    }

    .card-thumb-fallback {
      width: 100%;
      aspect-ratio: 16 / 9;
      max-height: 200px;
      background: linear-gradient(130deg, var(--surface-3), var(--surface-2));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-family: var(--font-mono);
      font-size: 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
    }

    .card-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }

    .chip {
      font-family: var(--font-mono);
      font-size: 9px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 100px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      white-space: nowrap;
      position: relative;
      z-index: 20;
    }

    .chip--primary {
      background: var(--teal-50);
      border-color: var(--border-accent);
      color: var(--text-accent);
    }

    [data-theme="dark"] .chip--primary {
      background: color-mix(in srgb, var(--teal-500) 12%, transparent);
    }

    .card-title {
      font-family: var(--font-display);
      font-size: 16px;
      font-weight: 600;
      line-height: 1.3;
      letter-spacing: -0.01em;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .card-excerpt {
      font-size: 12px;
      line-height: 1.65;
      color: var(--text-secondary);
      margin-bottom: 14px;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    .card-footer-date-only {
      display: flex;
      align-items: center;
    }

    .card-author {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-author-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--logo-bg);
      color: var(--logo-text);
      font-family: var(--font-body);
      font-weight: 600;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-author-avatar-img {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .card-author-meta {
      display: flex;
      flex-direction: column;
    }

    .card-author-name {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .card-author-date {
      font-family: var(--font-mono);
      font-size: 9px;
      color: var(--text-muted);
    }

    .hero-card {
      display: block;
      position: relative;
      width: 100%;
      overflow: hidden;
      border-radius: var(--r-lg);
      box-shadow: var(--shadow-md);
      transition: box-shadow 0.18s;

      &:hover .hero-thumb {
        transform: scale(1.03);
      }
    }

    .hero-thumb-wrap {
      position: relative;
      width: 100%;
      padding-bottom: 52%;
    }

    .hero-thumb {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }

    .hero-thumb-fallback {
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--text-accent) 18%, var(--surface-0));
    }

    .hero-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
    }

    .hero-body {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24px 32px;
    }

    .hero-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .hero-chip {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 10px;
      border-radius: 100px;
      background: rgba(255,255,255,0.2);
      color: white;
      backdrop-filter: blur(4px);
      transition: background 0.12s;
      position: relative;
      z-index: 20;

      &:hover { background: rgba(255,255,255,0.3); }
    }

    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(1.4rem, 3vw, 2.25rem);
      font-weight: 700;
      color: white;
      line-height: 1.15;
      margin-bottom: 12px;
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: rgba(255,255,255,0.75);
    }
  `],
  template: `
    @if (variant() === 'hero') {
      <div class="hero-card">
        <a
          [routerLink]="['/posts', post().slug]"
          class="absolute inset-0 z-10"
          [attr.aria-label]="post().title"
        ></a>
        <div class="hero-thumb-wrap">
          @if (post().thumbnailUrl) {
            <img
              class="hero-thumb"
              [src]="post().thumbnailUrl"
              [alt]="post().thumbnailAlt || post().title"
            />
          } @else {
            <div class="hero-thumb-fallback"></div>
          }
          <div class="hero-gradient"></div>
          <div class="hero-body">
            @if (firstTwoTags().length > 0 && tagLabelsReady()) {
              <div class="hero-tags">
                @for (tag of firstTwoTags(); track tag) {
                  <a
                    [routerLink]="['/posts']"
                    [queryParams]="{ tag: tag }"
                    class="hero-chip"
                  >{{ tag | tagLabel: tagLookupForLabels() }}</a>
                }
              </div>
            }
            <h2 class="hero-title">{{ post().title }}</h2>
            <div class="hero-meta">
              @if (authorsReady() && authorName()) {
                <span>{{ authorName() }}</span>
                <span aria-hidden="true">·</span>
              }
              <time [dateTime]="publishedDate().toISOString()">
                {{ publishedDate() | date: 'MMM d, yyyy' }}
              </time>
              @if (post().readingTimeMinutes) {
                <span aria-hidden="true">·</span>
                <span>{{ post().readingTimeMinutes }} min read</span>
              }
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="card">
        <a
          [routerLink]="['/posts', post().slug]"
          class="card-link-overlay"
          [attr.aria-label]="post().title"
        ></a>

        @if (post().thumbnailUrl) {
          <img
            class="card-thumb"
            [src]="post().thumbnailUrl"
            [alt]="post().thumbnailAlt || post().title"
          />
        } @else {
          <div class="card-thumb-fallback">No image</div>
        }

        <div class="card-body">
          @if (firstTwoTags().length > 0 && tagLabelsReady()) {
            <div class="card-tags">
              @for (tag of firstTwoTags(); track tag; let i = $index) {
                <a
                  [routerLink]="['/posts']"
                  [queryParams]="{ tag: tag }"
                  [class]="i === 0 ? 'chip chip--primary' : 'chip'"
                  style="position: relative; z-index: 20;"
                >{{ tag | tagLabel: tagLookupForLabels() }}</a>
              }
            </div>
          }

          <h2 class="card-title">{{ post().title }}</h2>

          @if (post().excerpt) {
            <p class="card-excerpt">{{ post().excerpt }}</p>
          }

          <div class="card-footer">
            @if (authorsReady() && authorName()) {
              <div class="card-author">
                @if (authorPhotoUrl()) {
                  <img
                    class="card-author-avatar-img"
                    [src]="authorPhotoUrl()!"
                    alt=""
                  />
                } @else {
                  <div class="card-author-avatar">
                    {{ authorInitial() }}
                  </div>
                }
                <div class="card-author-meta">
                  <span class="card-author-name">{{ authorName() }}</span>
                  <span class="card-author-date">
                    {{ publishedDate() | date: 'MMM d, yyyy' }}
                    @if (post().readingTimeMinutes) { · {{ post().readingTimeMinutes }} min }
                  </span>
                </div>
              </div>
            } @else {
              <div class="card-footer-date-only">
                <span class="card-author-date">
                  {{ publishedDate() | date: 'MMM d, yyyy' }}
                  @if (post().readingTimeMinutes) { · {{ post().readingTimeMinutes }} min }
                </span>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class BlogPostCardComponent {
  readonly post = input.required<BlogPost>();
  readonly variant = input<'hero' | 'card'>('card');
  readonly authorName = input<string | null>(null);
  readonly authorPhotoUrl = input<string | null>(null);
  /**
   * When false (e.g. SSR), omit author until client resolves Firestore authors.
   * When true without {@link authorName}, show date-only footer.
   */
  readonly authorsReady = input(false);
  /** When false, tag chips are hidden until Firestore tag labels are available. */
  readonly tagLabelsReady = input(false);
  /** Optional map from tag id → Tag; improves labels when {@link tagLabelsReady} is true. */
  readonly tagLookupForLabels = input<Map<string, Tag> | undefined>(undefined);

  protected readonly publishedDate = computed(() => new Date(this.post().publishedAt));
  protected readonly firstTwoTags = computed(() => this.post().tags.slice(0, 2));
  protected readonly authorInitial = computed(() => {
    const name = this.authorName()?.trim();
    if (name) return name[0]?.toUpperCase() ?? '?';
    return (this.post().title ?? '')[0]?.toUpperCase() ?? '?';
  });
}
