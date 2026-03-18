import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MarkdownComponent as NgxMarkdownComponent } from 'ngx-markdown';
import type { EmbeddedMediaEntry } from '@foliokit/cms-core';

@Component({
  selector: 'folio-markdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgxMarkdownComponent],
  template: `<markdown [data]="processedContent()" />`,
  styles: [`
    :host { display: block; }
    :host ::ng-deep img { max-width: 100%; height: auto; border-radius: 0.5rem; }
    :host ::ng-deep pre { overflow-x: auto; border-radius: 0.5rem; padding: 1rem; }
    :host ::ng-deep h1, :host ::ng-deep h2, :host ::ng-deep h3,
    :host ::ng-deep h4, :host ::ng-deep h5, :host ::ng-deep h6 {
      color: var(--mat-sys-on-surface);
    }
    :host ::ng-deep a { color: var(--mat-sys-primary); }
    :host ::ng-deep blockquote {
      border-left: 4px solid var(--mat-sys-outline-variant);
      margin: 0;
      padding-left: 1rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `],
})
export class MarkdownComponent {
  readonly content = input.required<string>();
  readonly embeddedMedia = input<Record<string, EmbeddedMediaEntry>>({});

  readonly processedContent = computed(() => {
    const raw = this.content();
    const media = this.embeddedMedia();
    if (!media || Object.keys(media).length === 0) return raw;

    // Replace ![alt](token) where token is a key in embeddedMedia with the resolved URL
    return raw.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, token) => {
      const entry = media[token];
      if (!entry) return _match;
      return `![${alt}](${entry.url})`;
    });
  });
}
