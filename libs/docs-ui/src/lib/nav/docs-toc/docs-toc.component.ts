import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCS_PAGE_META } from '../../tokens/docs-tokens';
import { DocsTocEntry } from '../../models/docs-page-meta.model';

@Component({
  selector: 'docs-toc',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './docs-toc.component.html',
  styleUrl: './docs-toc.component.scss',
})
export class DocsTocComponent implements OnInit {
  private readonly pageMeta = inject(DOCS_PAGE_META, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly entries = signal<DocsTocEntry[]>(this.pageMeta?.headings ?? []);
  readonly activeId = signal<string | null>(null);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const headingIds = this.entries().map((e) => e.id);
    if (!headingIds.length) return;

    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          this.activeId.set(visible.target.id);
        }
      },
      { rootMargin: '0px 0px -60% 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
