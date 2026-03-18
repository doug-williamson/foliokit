import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { PostService } from '@foliokit/cms-core';
import { MarkdownComponent } from '@foliokit/cms-markdown';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink, DatePipe, MarkdownComponent],
})
export class PostDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly postService = inject(PostService);
  private readonly titleService = inject(Title);
  private readonly meta = inject(Meta);

  private readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';

  protected readonly post = toSignal(
    this.postService.getPostBySlug(this.slug),
    { initialValue: undefined },
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
    });
  }
}
