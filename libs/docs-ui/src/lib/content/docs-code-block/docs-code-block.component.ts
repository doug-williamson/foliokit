import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  ViewChild,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'docs-code-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconButton, MatIconModule],
  templateUrl: './docs-code-block.component.html',
  styleUrl: './docs-code-block.component.scss',
})
export class DocsCodeBlockComponent implements AfterViewInit {
  readonly code = input.required<string>();
  readonly language = input<string>('typescript');

  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('codeEl') codeEl!: ElementRef<HTMLElement>;

  readonly copied = signal(false);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const el = this.codeEl.nativeElement;
    el.textContent = this.code();

    import('highlight.js/lib/core').then(({ default: hljs }) => {
      Promise.all([
        import('highlight.js/lib/languages/typescript'),
        import('highlight.js/lib/languages/xml'),
        import('highlight.js/lib/languages/scss'),
        import('highlight.js/lib/languages/bash'),
        import('highlight.js/lib/languages/json'),
      ]).then(([ts, xml, scss, bash, json]) => {
        hljs.registerLanguage('typescript', ts.default);
        hljs.registerLanguage('html', xml.default);
        hljs.registerLanguage('scss', scss.default);
        hljs.registerLanguage('bash', bash.default);
        hljs.registerLanguage('json', json.default);
        hljs.highlightElement(el);
      });
    });
  }

  copy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    navigator.clipboard.writeText(this.code()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
