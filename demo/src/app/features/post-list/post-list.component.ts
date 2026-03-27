import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DatePipe } from '@angular/common';
import type { BlogPost } from '@foliokit/cms-core';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="container">
      <h1>Lab Notes</h1>
      @for (post of posts(); track post.id) {
        <a [routerLink]="['/blog', post.slug]" class="post-card">
          <div class="post-meta">
            <time>{{ post.publishedAt | date:'mediumDate' }}</time>
            <span class="reading-time">{{ post.readingTimeMinutes }} min read</span>
          </div>
          <h2>{{ post.title }}</h2>
          @if (post.subtitle) {
            <p class="subtitle">{{ post.subtitle }}</p>
          }
          <p class="excerpt">{{ post.excerpt }}</p>
          <div class="tags">
            @for (tag of post.tags; track tag) {
              <span class="tag">{{ tag }}</span>
            }
          </div>
        </a>
      }
    </div>
  `,
  styles: [`
    .container { max-width: 720px; margin: 0 auto; padding: 32px 24px; }
    h1 {
      font-family: var(--font-display);
      color: var(--text-primary);
      margin-bottom: 32px;
    }
    .post-card {
      display: block;
      background: var(--surface-0);
      border: 1px solid var(--border);
      border-radius: var(--r-lg);
      padding: 24px;
      margin-bottom: 20px;
      text-decoration: none;
      color: inherit;
      box-shadow: var(--shadow-sm);
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .post-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--border-accent);
    }
    .post-meta {
      display: flex;
      gap: 12px;
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    h2 { color: var(--text-primary); margin: 0 0 4px; font-size: 1.25rem; }
    .subtitle { color: var(--text-secondary); margin: 0 0 8px; font-size: 0.95rem; }
    .excerpt { color: var(--text-secondary); margin: 0 0 12px; font-size: 0.9rem; line-height: 1.5; }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag {
      font-size: 0.75rem;
      padding: 2px 10px;
      border-radius: var(--r-2xl);
      background: var(--surface-2);
      color: var(--text-secondary);
    }
  `],
})
export class PostListComponent {
  private readonly route = inject(ActivatedRoute);
  readonly posts = toSignal(
    this.route.data.pipe(map((d) => d['posts'] as BlogPost[])),
    { initialValue: [] },
  );
}
