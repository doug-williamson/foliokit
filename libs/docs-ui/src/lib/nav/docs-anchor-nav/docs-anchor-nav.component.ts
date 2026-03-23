import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  PLATFORM_ID,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCS_PAGE_META } from '../../tokens/docs-tokens';

export interface AnchorLink {
  label: string;
  id: string;
}

@Component({
  selector: 'docs-anchor-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (isVisible() && effectiveAnchors().length) {
      <nav aria-label="On this page">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider opacity-50">On this page</p>
        <ul class="flex flex-col gap-0.5">
          @for (anchor of effectiveAnchors(); track anchor.id) {
            <li>
              <a
                [href]="'#' + anchor.id"
                class="anchor-nav-link block py-0.5 text-sm transition-colors"
                [class.anchor-nav-link--active]="activeId() === anchor.id"
              >
                {{ anchor.label }}
              </a>
            </li>
          }
        </ul>
      </nav>
    }
  `,
  styles: `
    .anchor-nav-link {
      color: var(--mat-sys-on-surface-variant);

      &:hover {
        color: var(--mat-sys-on-surface);
      }

      &--active {
        color: var(--mat-sys-primary);
        font-weight: 500;
      }
    }
  `,
})
export class DocsAnchorNavComponent implements OnInit {
  @Input() anchors: AnchorLink[] = [];

  private readonly pageMeta = inject(DOCS_PAGE_META, { optional: true });
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly isVisible = signal(false);
  readonly activeId = signal<string | null>(null);

  readonly effectiveAnchors = signal<AnchorLink[]>([]);

  constructor() {
    afterNextRender(() => {
      this.isVisible.set(document.documentElement.scrollHeight > 600);
    });
  }

  ngOnInit(): void {
    const resolved: AnchorLink[] =
      this.anchors.length > 0
        ? this.anchors
        : (this.pageMeta?.headings?.map((h) => ({ label: h.label, id: h.id })) ?? []);

    this.effectiveAnchors.set(resolved);

    if (!isPlatformBrowser(this.platformId) || !resolved.length) return;

    const elements = resolved
      .map((a) => document.getElementById(a.id))
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
