import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Series, SeriesNavItem } from '@foliokit/cms-core';

@Component({
  selector: 'folio-series-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="series-nav-block" aria-label="Series navigation">
      <div class="series-nav-header">
        <p class="series-title">
          <a [routerLink]="['/series', series().slug]" class="series-title-link">
            {{ series().name }}
          </a>
        </p>
        @if (currentIndex() !== -1) {
          <span class="series-part">Part {{ currentIndex() + 1 }} of {{ posts().length }}</span>
        }
      </div>

      <ol class="series-toc">
        @for (post of posts(); track post.id) {
          <li class="series-toc-item" [class.is-current]="post.id === currentPostId()">
            <a
              [routerLink]="['/posts', post.slug]"
              class="series-toc-link"
              [attr.aria-current]="post.id === currentPostId() ? 'page' : null"
            >
              {{ post.title }}
            </a>
          </li>
        }
      </ol>

      @if (prev() || next()) {
        <div class="series-pn">
          @if (prev(); as p) {
            <a [routerLink]="['/posts', p.slug]" class="series-pn-link series-pn-link--prev">
              ← {{ p.title }}
            </a>
          } @else {
            <span></span>
          }
          @if (next(); as n) {
            <a [routerLink]="['/posts', n.slug]" class="series-pn-link series-pn-link--next">
              {{ n.title }} →
            </a>
          }
        </div>
      }
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      --accent: var(--text-accent);
    }

    .series-nav-block {
      margin-top: 24px;
      padding: 16px 20px;
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: var(--r-xl, 12px);
    }

    .series-nav-header {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin-bottom: 12px;
    }

    .series-title {
      margin: 0;
    }

    .series-title-link {
      font-family: var(--font-body);
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--accent);
      text-decoration: none;
    }

    .series-title-link:hover {
      text-decoration: underline;
    }

    .series-part {
      font-family: var(--font-body);
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .series-toc {
      margin: 0;
      padding: 0;
      list-style: none;
      border-left: 2px solid var(--border);
    }

    .series-toc-item {
      position: relative;
    }

    .series-toc-item.is-current {
      border-left: 2px solid var(--accent);
      margin-left: -2px;
    }

    .series-toc-link {
      display: block;
      padding: 4px 12px;
      font-family: var(--font-body);
      font-size: 0.8rem;
      line-height: 1.45;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.15s;
    }

    .series-toc-item.is-current .series-toc-link {
      color: var(--accent);
      font-weight: 600;
    }

    .series-toc-link:hover {
      color: var(--text-primary);
    }

    .series-pn {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
    }

    .series-pn-link {
      font-family: var(--font-body);
      font-size: 0.78rem;
      color: var(--text-muted);
      text-decoration: none;
      max-width: 45%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color 0.15s;
    }

    .series-pn-link:hover {
      color: var(--accent);
    }

    .series-pn-link--next {
      text-align: right;
      margin-left: auto;
    }
  `],
})
export class SeriesNavComponent {
  readonly series = input.required<Series>();
  readonly posts = input.required<SeriesNavItem[]>();
  readonly currentPostId = input.required<string>();

  protected readonly currentIndex = computed(() =>
    this.posts().findIndex((p) => p.id === this.currentPostId()),
  );

  protected readonly prev = computed(() => this.posts()[this.currentIndex() - 1] ?? null);
  protected readonly next = computed(() => this.posts()[this.currentIndex() + 1] ?? null);
}
