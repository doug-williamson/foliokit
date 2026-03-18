import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { switchMap } from 'rxjs/operators';
import { PostService } from '@foliokit/cms-core';
import { MarkdownComponent } from '@foliokit/cms-markdown';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MarkdownComponent,
  ],
})
export class PostDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly postService = inject(PostService);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  protected readonly post = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('slug') ?? '';
        return this.postService.getPostBySlug(slug);
      }),
    ),
  );

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

      // Canonical URL via <link rel="canonical">
      if (p.seo?.canonicalUrl) {
        let link: HTMLLinkElement | null = this.document.querySelector(
          'link[rel="canonical"]',
        );
        if (!link) {
          link = this.document.createElement('link');
          link.setAttribute('rel', 'canonical');
          this.document.head.appendChild(link);
        }
        link.setAttribute('href', p.seo.canonicalUrl);
      }
    });
  }
}
