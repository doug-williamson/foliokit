import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DatePipe } from '@angular/common';
import type { BlogPost } from '@foliokit/cms-core';
import { MarkdownComponent } from '@foliokit/cms-markdown';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [MarkdownComponent, RouterLink, DatePipe],
  template: `
    @if (post()) {
      <article class="container">
        <a routerLink="/blog" class="back-link">&larr; Back to Lab Notes</a>
        <header>
          <div class="meta">
            <time>{{ post()!.publishedAt | date:'mediumDate' }}</time>
            <span>{{ post()!.readingTimeMinutes }} min read</span>
          </div>
          <h1>{{ post()!.title }}</h1>
          @if (post()!.subtitle) {
            <p class="subtitle">{{ post()!.subtitle }}</p>
          }
          <div class="tags">
            @for (tag of post()!.tags; track tag) {
              <span class="tag">{{ tag }}</span>
            }
          </div>
        </header>
        <hr />
        <folio-markdown [content]="post()!.content" [embeddedMedia]="post()!.embeddedMedia" />
      </article>
    }
  `,
  styles: [`
    .container { max-width: 720px; margin: 0 auto; padding: 32px 24px; }
    .back-link {
      display: inline-block;
      margin-bottom: 24px;
      color: var(--text-accent);
      text-decoration: none;
      font-size: 0.9rem;
    }
    .back-link:hover { text-decoration: underline; }
    .meta {
      display: flex;
      gap: 12px;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    h1 {
      font-family: var(--font-display);
      color: var(--text-primary);
      margin: 0 0 8px;
      font-size: 2rem;
    }
    .subtitle { color: var(--text-secondary); font-size: 1.1rem; margin: 0 0 12px; }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
    .tag {
      font-size: 0.75rem;
      padding: 2px 10px;
      border-radius: var(--r-2xl);
      background: var(--surface-2);
      color: var(--text-secondary);
    }
    hr { border: none; border-top: 1px solid var(--border); margin: 0 0 24px; }
  `],
})
export class PostDetailComponent {
  private readonly route = inject(ActivatedRoute);
  readonly post = toSignal(
    this.route.data.pipe(map((d) => (d['post'] as BlogPost) ?? null)),
    { initialValue: null },
  );
}
