import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'docs-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTabsModule, MatIconButton, MatIconModule],
  templateUrl: './docs-preview.component.html',
  styleUrl: './docs-preview.component.scss',
})
export class DocsPreviewComponent implements AfterViewInit {
  @Input() code = '';

  private readonly platformId = inject(PLATFORM_ID);

  readonly copied = signal(false);
  readonly highlightedHtml = signal<string | null>(null);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initHighlight();
  }

  private async initHighlight(): Promise<void> {
    const { default: hljs } = await import('highlight.js/lib/core');
    const [ts, xml, scss, bash, json] = await Promise.all([
      import('highlight.js/lib/languages/typescript'),
      import('highlight.js/lib/languages/xml'),
      import('highlight.js/lib/languages/scss'),
      import('highlight.js/lib/languages/bash'),
      import('highlight.js/lib/languages/json'),
    ]);
    hljs.registerLanguage('typescript', ts.default);
    hljs.registerLanguage('html', xml.default);
    hljs.registerLanguage('scss', scss.default);
    hljs.registerLanguage('bash', bash.default);
    hljs.registerLanguage('json', json.default);

    const result = hljs.highlightAuto(this.code, [
      'typescript',
      'html',
      'scss',
      'bash',
      'json',
    ]);
    this.highlightedHtml.set(result.value);
  }

  escapedCode(): string {
    return this.code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  copy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard.writeText(this.code).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
