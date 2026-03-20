// TODO: Phase 6 — wire HomePage CmsPage from Firestore.
// Replace static content with dynamic data from pages/home document.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'folio-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="flex items-center justify-center px-4 py-20"
      style="background: var(--folio-blog-surface); min-height: 100%"
    >
      <div style="max-width: 720px; width: 100%; text-align: center">
        <h1
          class="text-4xl md:text-5xl font-bold mb-4 leading-tight"
          style="font-family: var(--folio-blog-font-serif); color: var(--folio-blog-text-primary)"
        >
          FolioKit Blog
        </h1>
        <p
          class="text-lg md:text-xl mb-10"
          style="color: var(--folio-blog-text-secondary)"
        >
          Thoughts on building products, writing software, and designing systems.
        </p>
        <a
          routerLink="/posts"
          class="inline-block px-8 py-3 rounded-full text-base font-semibold"
          style="background: var(--folio-blog-accent); color: #ffffff"
        >
          Read Posts
        </a>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    a:hover { background: var(--folio-blog-accent-hover) !important; }
  `],
})
export class HomeComponent {}
