// TODO: Phase 6 — wire HomePage CmsPage from Firestore.
// Replace static content with dynamic data from pages/home document.
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';
import { SiteConfigService } from '@foliokit/cms-core';
import { BlogSeoService } from '../../services/blog-seo.service';

@Component({
  selector: 'folio-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink],
  template: `
    <div
      class="flex items-center justify-center px-4 py-20"
      style="background: var(--bg); min-height: 100%"
    >
      <div style="max-width: 720px; width: 100%; text-align: center">
        <h1
          class="text-4xl md:text-5xl font-bold mb-4 leading-tight"
          style="font-family: var(--font-display); color: var(--text-primary)"
        >
          FolioKit Blog
        </h1>
        <p
          class="text-lg md:text-xl mb-10"
          style="color: var(--text-secondary)"
        >
          Thoughts on building products, writing software, and designing systems.
        </p>
        <a
          routerLink="/posts"
          class="inline-block px-8 py-3 rounded-full text-base font-semibold"
          style="background: var(--text-accent); color: #ffffff"
        >
          Read Posts
        </a>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    a:hover { background: color-mix(in srgb, var(--text-accent) 80%, var(--ink-950)) !important; }
  `],
})
export class HomeComponent {
  private readonly siteConfigService = inject(SiteConfigService);
  private readonly blogSeoService = inject(BlogSeoService);

  private readonly siteConfig = toSignal(
    this.siteConfigService.getDefaultSiteConfig().pipe(take(1)),
    { initialValue: null },
  );

  constructor() {
    effect(() => {
      const config = this.siteConfig();
      if (!config) return;
      this.blogSeoService.setDefaultMeta(config);
    });
  }
}
