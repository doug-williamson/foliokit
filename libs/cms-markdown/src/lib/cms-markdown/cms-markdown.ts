import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MarkdownComponent as NgxMarkdownComponent } from 'ngx-markdown';
import type { EmbeddedMediaEntry } from '@foliokit/cms-core';

@Component({
  selector: 'folio-markdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgxMarkdownComponent],
  template: `<markdown class="prose prose-neutral dark:prose-invert max-w-none" [data]="processedContent()" />`,
  styles: [`
    :host { display: block; }
    :host ::ng-deep img { max-width: 100%; height: auto; border-radius: 0.5rem; }
  `],
})
export class MarkdownComponent {
  readonly content = input.required<string>();
  readonly embeddedMedia = input<Record<string, EmbeddedMediaEntry>>({});

  readonly processedContent = computed(() => {
    const raw = this.content();
    console.log('raw', raw);
    const media = this.embeddedMedia();
    if (!media || Object.keys(media).length === 0) return raw;

    // Replace ![alt](token) where token is a key in embeddedMedia with the resolved URL
    return raw.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, token) => {
      const entry = media[token];
      if (!entry) return _match;
      return `![${alt}](${entry.downloadUrl})`;
    });
  });
}
